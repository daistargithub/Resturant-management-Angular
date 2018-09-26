angular.module('App').controller('PosController',
	function ($rootScope, $scope, $http, $mdToast, $cookies, $mdDialog, $route, $q, services) {
		if ($cookies.session_uid == 'null' || $cookies.session_uid == null) {
			$scope.Expire_Session();
		}

		var self = $scope;
		var root = $rootScope;
		var newUser = false;
		var original;
		self.orderNoReset=root.orderNoReset;

		$rootScope.pagetitle = 'Build Order';

		root.toolbar_menu = {
			title: 'Reset Receipt'
		}
		root.barAction = function (ev) {
			window.location.href = '#pos';
			$rootScope.orderNoReset=true;
		}

		checkOrderNoReset=function(){
			if(self.orderNoReset){
				$mdToast.show($mdToast.simple().content("Reseted Invoice Number").position('bottom right'));
			}
			// alert(self.orderNoReset);
		}();


		original = {
			items: [],
			quantity: [],
			prices: [],
			item_names: [],
			cgst: [],
			sgst: [],
			user_id: 0,
			contact_name: null,
			contact_number: null,
			contact_address: null,
			bill_amount: 0,
			payable_amount: 0,
			customer_amount: null,
			order_cgst: 0,
			order_sgst: 0,
			order_comment: null,
			discount: 0,
			type: 0,
			gst_price: []
		};
		self.build = angular.copy(original);
		self.b1g1 = true;
		self.showCategory = true;
		self.showSubcate = false;
		self.showProduct = false;
		self.addedToppings=[];
		self.toppingListView=false;

		self.hide=function(){
			self.topping_show=false;
		}

		services.getToppings().then(function (data) {
			self.toppings = data.data;
			self.loading = false;
		});

		self.RemoveTopping=function($event, index){
			var newtoppings=[];
			var i=0;
			for(t of self.addedToppings){
				if(index != i){
					newtoppings.push(t);
				}else{
					self.build.payable_amount = Number(self.build.payable_amount) - Number(t.price);
					self.build.bill_amount = Number(self.build.bill_amount) - Number(t.price);
				}
				i++;
			}
			console.log(newtoppings);
			self.addedToppings=newtoppings;
			// self.addedToppings=self.addedToppings.slice(0,index)+self.addedToppings.slice(index+1,self.addedToppings.length);
			// console.log(self.addedToppings);

		}
		
		services.ActiveCategories().then(function (data) {
			self.active_categories = data.data;
			// alert(JSON.stringify(self.active_categories, null, 4));
		});

		services.getIngredients().then(function (data) {
			self.ingredients = data.data;
		});


		self.submit_topping=function(id){
			services.getToppingByID(id).then(function(data){
				if(data){
					self.toppingListView=true;
				}
				self.addedToppings.push(data.data[0]);
				
				self.build.payable_amount = Number(self.build.payable_amount)+Number(data.data[0].price);
				self.build.bill_amount = Number(self.build.bill_amount)+ Number(data.data[0].price);
			});
			// console.log(self.addedToppings);
		}
		self.ShowMyCategory = function () {
			self.showCategory = true;
			self.showSubcate = false;
			self.showProduct = false;
			self.topping_show = false;

			services.ActiveCategories().then(function (data) {
				self.active_categories = data.data;


			});
		};

		self.addUser = function ($event) {
			self.newUser = true;
		}

		self.ShowSubcategory = function (category) {
			self.showCategory = false;
			self.showSubcate = true;
			self.showProduct = false;
			self.topping_show = false;

			services.getSubcategory_by_cat(category).then(function (data) {
				self.active_categories = data.data;


			});
		};


		self.GetProductBySubcat = function (subcat) {
			self.showCategory = false;
			self.showSubcate = false;
			self.showProduct = true;

			services.getProduct_by_subcat(subcat).then(function (data) {
				self.active_categories = data.data;

			});
		};


		self.GetProducts = function (keyword) {
			if (keyword.length <= 0) {
				self.products = "";
			} else {
				services.Get_Stock_Products_by_keyword(keyword).then(function (data) {
					self.products = data.data;
				});
			}
		};

		self.SgstEmpty = function () { // myone

			if (self.build.order_sgst != 0) {

				self.build.payable_amount = Number(self.build.payable_amount) - Number(self.build.order_sgst);
				self.build.discount = Number(self.build.order_sgst);
				self.build.order_sgst = 0;
				$mdToast.show($mdToast.simple().content("Small pizza Cost is Free.").position('bottom right'));

			}

		};

		self.AddProduct = function (ev, p) {

			if (self.build.items.indexOf(p.id) >= 0) {
				pid = self.build.items.indexOf(p.id);
				self.build.quantity[pid] = self.build.quantity[pid] + 1; //myone
			} else {
				self.build.items.push(p.id);
				self.build.quantity.push(1); //myone
				self.build.prices.push(Math.round(p.price));
				self.build.cgst.push(p.cgst);
				self.build.sgst.push(p.sgst);
				self.build.item_names.push(p.title);

			}

			current_amount = p.price * 1; //myone
			self.build.bill_amount = Number(self.build.bill_amount) + current_amount;
			self.build.bill_amount = self.build.bill_amount.toFixed(2);

			current_cgst = current_amount * (p.cgst / 100);
			//current_cgst=current_cgst.toFixed(2);
			self.build.order_cgst = Number(self.build.order_cgst) + current_cgst;
			self.build.order_cgst = self.build.order_cgst.toFixed(2)

			current_sgst = current_amount * (p.sgst / 100);
			//current_sgst=current_sgst.toFixed(2);
			self.build.order_sgst = Number(self.build.order_sgst) + current_sgst;
			self.build.order_sgst = self.build.order_sgst.toFixed(2)

			self.build.payable_amount = Number(self.build.payable_amount) + Number(current_amount) + Number(current_cgst) + Number(current_sgst);
			self.build.payable_amount = self.build.payable_amount.toFixed(2);

			services.getOrderProduct(self.build.items.join()).then(function (data) {
				self.particulars = data.data;
				var flag_m = 0,
					flag_s = 0;
				for (var a = 0; a < self.particulars.length; a++) {
					if (self.particulars[a].title.indexOf("Medium") >= 0) {
						flag_m = 1;
					}
					if (self.particulars[a].title.indexOf("Small") >= 0) {
						flag_s = 1;
					}
				}
				if (flag_m == 1 && flag_s == 1) self.b1g1 = false;
			});

			self.topping_show=true;
			self.topping = null;

			$mdToast.show($mdToast.simple().content(p.title + " -" + 1 + " Unit" + " " + "added").position('bottom right'));
		};

		self.RemoveProductcount = function (ev, p) {

			if (self.build.items.indexOf(p.id) >= 0) {
				pid = self.build.items.indexOf(p.id);
				self.build.quantity[pid] = self.build.quantity[pid] - 1; //myone

				current_amount = p.price * 1; //myone
				self.build.bill_amount = Number(self.build.bill_amount) - current_amount;
				self.build.bill_amount = self.build.bill_amount.toFixed(2);

				current_cgst = current_amount * (p.cgst / 100);
				//current_cgst=current_cgst.toFixed(2);
				self.build.order_cgst = Number(self.build.order_cgst) - current_cgst;
				self.build.order_cgst = self.build.order_cgst.toFixed(2)

				current_sgst = current_amount * (p.sgst / 100);
				//current_sgst=current_sgst.toFixed(2);
				self.build.order_sgst = Number(self.build.order_sgst) - current_sgst;
				self.build.order_sgst = self.build.order_sgst.toFixed(2)

				self.build.payable_amount = Number(self.build.payable_amount) - Number(current_amount) - Number(current_cgst) - Number(current_sgst);
				self.build.payable_amount = self.build.payable_amount.toFixed(2);

				services.getOrderProduct(self.build.items.join()).then(function (data) {
					self.particulars = data.data;

				});

				$mdToast.show($mdToast.simple().content(p.title + " -" + 1 + " Unit" + " " + "removed").position('bottom right'));
			}
		};

		self.RemoveProduct = function (ev, p) {


			pid = self.build.items.indexOf(p.id);

			self.qnt = self.build.quantity[pid];
			self.prc = self.build.prices[pid];
			self.cgst = self.build.cgst[pid];
			self.sgst = self.build.sgst[pid];

			self.build.items.splice(pid, 1);
			self.build.quantity.splice(pid, 1);
			self.build.prices.splice(pid, 1);
			self.build.item_names.splice(pid, 1);
			self.build.cgst.splice(pid, 1);
			self.build.sgst.splice(pid, 1);


			current_amount = self.prc * self.qnt;
			bill_amount = self.build.bill_amount - current_amount;
			self.build.bill_amount = bill_amount.toFixed(2);
			//self.build.payable_amount=bill_amount;


			current_cgst = current_amount * (p.cgst / 100);
			//current_cgst=current_cgst.toFixed(2);
			self.build.order_cgst = Number(self.build.order_cgst) - current_cgst;
			self.build.order_cgst = self.build.order_cgst.toFixed(2)
			if (self.build.order_cgst < 0) {
				self.build.order_cgst = 0;
			}

			current_sgst = current_amount * (p.sgst / 100);
			//current_sgst=current_sgst.toFixed(2);
			self.build.order_sgst = Number(self.build.order_sgst) - current_sgst;
			self.build.order_sgst = self.build.order_sgst.toFixed(2)
			if (self.build.order_sgst < 0) {
				self.build.order_sgst = 0;
			}


			self.build.payable_amount = Number(self.build.payable_amount) - Number(current_amount) - Number(current_cgst) - Number(current_sgst);
			self.build.payable_amount = self.build.payable_amount.toFixed(2);
			if (self.build.payable_amount < 0) {
				self.build.payable_amount = 0;
			}


			if (self.build.items.join() == '') {
				self.particulars = '';
			} else {
				services.getOrderProduct(self.build.items.join()).then(function (data) {
					self.particulars = data.data;
				});
			}

			$mdToast.show($mdToast.simple().content(p.title + " -" + self.qnt + " Unit" + " " + "Removed").position('bottom right'));
		};

		services.getCustomers().then(function (data) {
			self.cust = data.data;
			self.loading = false;
			//console.log(JSON.stringify(self.cust));
		});


		self.getUserDetails = function (id) {
			services.getCustomer_by_id(id).then(function (data) {
				cust = data.data;

				self.build.contact_name = cust[0].name;
				self.build.contact_number = cust[0].contact;
				self.build.contact_address = cust[0].address;
				//self.delivery_area=cust[0].area_title;
			});
		};


		self.ChangeDiscount = function (discount) {
			//alert(self.build.bill_amount);
			self.build.discount = discount;
			self.build.payable_amount = Number(self.build.bill_amount) + Number(self.build.order_cgst) + Number(self.build.order_sgst) - discount;
		};

		self.smallServe = function (b) {
			//console.log(b); 
			var small_id = [];
			for (var i = 0; i < b.item_names.length; i++) {
				if (b.item_names[i].indexOf("Small") >= 0) {
					small_id.push(i);
				}
			}
			//console.log(small_id);
			for (var i = 0; i < small_id.length; i++) {
				self.build.bill_amount = Number(self.build.bill_amount) - b.prices[small_id[i]] * b.quantity[small_id[i]];
				self.build.bill_amount = self.build.bill_amount.toFixed(2);
				self.build.order_cgst = Number(self.build.order_cgst) - b.cgst[small_id[i]] * b.quantity[small_id[i]];
				self.build.order_sgst = Number(self.build.order_sgst) - b.sgst[small_id[i]] * b.quantity[small_id[i]];
				self.build.payable_amount = Number(self.build.payable_amount) - b.prices[small_id[i]] * b.quantity[small_id[i]] - b.sgst[small_id[i]] * b.quantity[small_id[i]] - b.cgst[small_id[i]] * b.quantity[small_id[i]];
				self.build.payable_amount = self.build.payable_amount.toFixed(2);

				self.build.prices[small_id[i]] = 0;
				self.build.cgst[small_id[i]] = 0;
				self.build.sgst[small_id[i]] = 0;
			}
		};

		self.submit = function (b) {
			self.wait = true;
			$mdToast.show($mdToast.simple().content("Process...").position('bottom right'));

			//   console.log(b);
			//   alert(b.contact_name);
			//if(Number(b.custom_amount) <= Number(b.payable_amount)) b.custom_amount = null;
			
			// Topping part added

			if (self.addedToppings) {
				for (t of self.addedToppings) {
					
					services.updateIngredientByTopping(t.ingredient_id, t.amount).then(function (data) {
						console.log(data);									
					});
						
				}
			}


			if (b.user_id == 0) {

				var person = {
					name: b.contact_name,
					contact: b.contact_number,
					address: b.contact_address,
					email: ''
				};

				services.insertCustomer(person).then(function (resp) {
					b.user_id = resp.insert_id;
					b.items = b.items.join() + ',';
					b.quantity = b.quantity.join() + ',';
					b.prices = b.prices.join() + ',';
					b.item_names = b.item_names.join(',%,%') + ',%,%';
					b.cgst = b.cgst.join() + ',';
					b.sgst = b.sgst.join() + ',';

					services.insertOrder(b, self.orderNoReset ? 1 : 0).then(function (resp) {
						//console.log(resp);
						if (resp.status == "success") {
							//console.log("success:"+resp);
							services.getOrderProduct(resp.data.items.replace(/,\s*$/, "")).then(function (data) {
								products = data.data;
								//alert(products.length);             	
								for (i = 0; i < products.length; i++) {

									services.ActiveProductIngredientConsumption(products[i].id, resp.data.quantity, i).then(function (data1) {
										ingredients = data1.data;
										quantity = ingredients[0].quantity.split(",");
										myquantity = quantity[ingredients[0].iteration];
										//alert(myquantity);

										for (j = 0; j < ingredients.length; j++) {
											newstock = ingredients[j].consumption * myquantity;
											services.StockUpdate(ingredients[j].id, newstock).then(function (mydata) {
												//alert(JSON.stringify(mydata, null, 4));
											});
										}
									});
								}
							});
							self.afterSubmit(resp);
						}
						services.generateInvoice(resp.data).then(function (e) {
							console.log(e);
							if (e == "")
								newPopup(resp.insert_id);
						});
					});

					
				});
			} else {
				//console.log(b);
				b.items = b.items.join() + ',';
				b.quantity = b.quantity.join() + ',';
				b.prices = b.prices.join() + ',';
				b.item_names = b.item_names.join(',%,%') + ',%,%';
				b.cgst = b.cgst.join() + ',';
				b.sgst = b.sgst.join() + ',';

				services.insertOrder(b, self.orderNoReset ? 1 : 0).then(function (resp) {
					// console.log(resp);
					if (resp.status == "success") {
						//console.log("success:"+resp);
						services.getOrderProduct(resp.data.items.replace(/,\s*$/, "")).then(function (data) {
							products = data.data;
							//alert(products.length);             	
							for (i = 0; i < products.length; i++) {

								services.ActiveProductIngredientConsumption(products[i].id, resp.data.quantity, i).then(function (data1) {
									ingredients = data1.data;
									quantity = ingredients[0].quantity.split(",");
									myquantity = quantity[ingredients[0].iteration];
									//alert(myquantity);

									for (j = 0; j < ingredients.length; j++) {
										newstock = ingredients[j].consumption * myquantity;
										services.StockUpdate(ingredients[j].id, newstock).then(function (mydata) {
											//alert(JSON.stringify(mydata, null, 4));
										});
									}
								});
							}
						});

						self.afterSubmit(resp);
					}

					services.generateInvoice(resp.data).then(function (e) {
						console.log(e);
						//  alert(e);
						if (e == "")
							newPopup(resp.insert_id);
					});



				});
			}
		}


		self.afterSubmit = function (resp) {
			if (resp.status == "success") {
				$mdToast.show($mdToast.simple().hideDelay(1000).content(resp.msg).position('bottom right'))
					.then(function () {

						window.location.reload();

					});
			} else {
				$mdToast.show($mdToast.simple().hideDelay(3000).content(resp.msg).position('bottom right'))
			}
		};
	});

function newPopup(url) {
	popupWindow = window.open(
		'invoice/' + url + '.pdf',
		'popUpWindow',
		'height=1000,width=800,right=5,top=5,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes')
}