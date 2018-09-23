var app=angular.module('App').controller('SubcategoryController', 
function($rootScope, $scope, $http, $mdToast, $cookies, $mdDialog, $route, services,$routeParams){
  if($cookies.session_uid == 'null' || $cookies.session_uid == null){ $scope.Expire_Session(); }
   
    var self             = $scope;
	var root             = $rootScope;
    self.loading         = true;

    self.cat = $routeParams.cat;
	$rootScope.pagetitle = 'Subcategory';
	
	
	root.toolbar_menu = { title: 'Add Subcategory' }
	root.barAction =  function(ev) {
    self.addSubcat(ev);
  }
 
	    services.getSubcategory().then(function(data){
          self.subcat = data.data;
          self.loading = false;
       });  
  
	
    $scope.numberOfPages=function(){
        return Math.ceil(self.subcat.length/$scope.pageSize);                
    }
    
     $scope.sort = function(keyname){
		$scope.sortKey = keyname;   //set the sortKey to the param passed
		$scope.reverse = !$scope.reverse; //if true make it false and vice versa
	} 
	
	
	  self.UpdateStatus = function(ev, s) {
	   var confirm = $mdDialog.confirm().title('Confirmation?')
      .content('Are you sure want to update Status?')
      .targetEvent(ev)
      .ok('OK').cancel('CANCEL');

      $mdDialog.show(confirm).then(function() {
      //  $mdToast.show($mdToast.simple().content("Process...").position('bottom right'));
        if(s.status==1){
		  s.status=0;
		 } else {
		 s.status=1;	 
		 }
  
        $mdToast.show($mdToast.simple().content("Process...").position('bottom right'));
         services.updateSubcat(s.id, s).then(function(resp){
			 self.afterSubmit(resp);
         });
       }, function() {
     });
  };  


  
  self.deleteSubcat = function(ev, s) {
    var confirm = $mdDialog.confirm().title('Delete Confirmation')
      .content('sorry delete subcategory not allowed?')
      .targetEvent(ev)
      .ok('OK').cancel('CANCEL');

    $mdDialog.show(confirm).then(function() {
    /*  services.deleteSubcat(s.id).then(function(res){
        console.log(JSON.stringify(res));
        if(res.status == 'success'){
		  services.decreaseCategoryCounter(s.category_id);//decrement subcat counter in category
          $mdToast.show($mdToast.simple().hideDelay(1000).content('Delete Subcategory '+s.s_title+' Success!').position('bottom right'))
          .then(function() {
            window.location.reload();
          });
        }else{
          $mdToast.show(
            $mdToast.simple().hideDelay(6000).action('CLOSE').content('Opps , Failed delete Sub-category '+s.s_title).position('bottom right')
          ).then(function(response){
          });
        }        
      });*/
      }, function() {
    });
  };  

	self.addSubcat = function(ev) {
    $mdDialog.show({
      controller          : SubcatControllerDialog,
      templateUrl         : 'templates/page/subcategory/create.html',
      parent              : angular.element(document.body),
      targetEvent         : ev,
      clickOutsideToClose : false,
      subcat              : null
    })
  };

  self.editSubcat = function(ev, s) {
    $mdDialog.show({
      controller          : SubcatControllerDialog,
      templateUrl         : 'templates/page/subcategory/create.html',
      parent              : angular.element(document.body),
      targetEvent         : ev,
      clickOutsideToClose : false,
      subcat            	: s
    })
  };
  
});

function SubcatControllerDialog($scope, $mdDialog, services, $mdToast, $route, subcat) {
  var self = $scope;
  var isNew = (subcat == null) ? true : false;
  var original ;
 
  self.title      = (isNew) ? 'Add Sub-category' : 'Edit Sub-category';
  self.buttonText = (isNew) ? 'SAVE' : 'UPDATE';
  
   self.status = [
    { id: 1, name: 'Active' },
    { id: 0, name: 'In-active' },
  ]; 
  
     
  
  if (isNew) {
    original = { title : null, category:null, priority:1,status:1 };
    self.subcat = angular.copy(original);
	
	 services.getCategories().then(function(data){
      self.categories = data.data;
     });
	
  } else {
    original = subcat;
    self.subcat = angular.copy(original);
	
	services.CategoryTitleById(self.subcat.category).then(function(data){
      self.categories = data.data;
     });
	
  }

  self.isClean = function() {
    return angular.equals(original, self.subcat);
  }

  self.hide = function() {
    $mdDialog.hide();
  };

  self.cancel = function() {
    $mdDialog.cancel();
  };

   self.submit = function(s) {
    $mdToast.show($mdToast.simple().content("Process...").position('bottom right'));
	self.loader = true;
	  
    if(isNew){
		// alert(JSON.stringify(s, null, 4));
         services.insertSubcat(s).then(function(resp){
            self.afterSubmit(resp);
        });
    } else {
        services.updateSubcat(s.id, s).then(function(resp){
          self.afterSubmit(resp);
        });        
     }
  };

  self.afterSubmit = function(resp) {
    if(resp.status == 'success'){
      $mdToast.show($mdToast.simple().hideDelay(1000).content(resp.msg).position('bottom right'))
      .then(function() {
        $mdDialog.hide();
        window.location.reload();    
      });  
    }else{
      $mdToast.show($mdToast.simple().hideDelay(3000).content(resp.msg).position('bottom right'))
    }    
  };
} 

 app.filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    }
});