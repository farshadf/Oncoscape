(function() {
    'use strict';
    angular
        .module('oncoscape')
        .directive('osLanding', landing);

    /** @ngInject */
    function landing() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/landing/landing.html',
            replace: true,
            controller: LandingController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function LandingController($state) {

            angular.element(".marquee-x").marquee({
                particlesNumber: 79,
                color: '#1396de',
                particle: {
                    speed: 39
                }
            });

            var vm = this;
            vm.login = function() {
                $state.go("login");
            };

            vm.getStarted = function() {
                $state.go("userdatasource");
            };
        }
    }
})();