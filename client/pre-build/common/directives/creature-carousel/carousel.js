app.directive('creatureCarousel', function(UserFactory, CreatureFactory, ShapeFactory, $state) {

    return {
        restrict: 'E',
        scope: {
            fcn: "=",
            slides: '=',
            file: '=',
            showLevel: '='
        },
        link: function(scope, elem, attr) {
            console.log('slides', scope.slides)
            scope.isAdmin = UserFactory.currentUser.isAdmin;
            scope.creatures = [];
            for (var i = 0; i < scope.slides.length; i += 3) {
                scope.creatures.push(scope.slides.slice(i, i + 3));
            };
            if (!scope.creatures.length) {
                scope.creatures = [
                    []
                ];
                scope.add = true;
            }
            scope.creatures = scope.creatures.reverse();
            scope.myInterval = 0;
            scope.noWrapSlides = false;

            scope.removeCreature = function(creature, index) {
                UserFactory.getUser(UserFactory.currentUser._id)
                    .then(function(user) {
                        user.creature.splice(index, 1);
                        console.log(user);
                        return UserFactory.updateUser(user)
                    })
                    .then(function() {
                        return CreatureFactory.deleteCreature(creature.creature)
                    })
                    .then(function() {
                        return ShapeFactory.removeShape(creature.shape)
                    })
                    .then(function() {
                        $state.go('creatures.select', {}, {
                            reload: true
                        })
                    })
            }
        },
        templateUrl: "pre-build/common/directives/creature-carousel/carousel.html"
    };

})