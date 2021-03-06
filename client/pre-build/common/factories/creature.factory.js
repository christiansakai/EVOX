app.factory('CreatureFactory', function(ShapeFactory, BehaviorFactory, TimeFactory, $http) {
    //Creature constructor
    function Creature(game, opts, voxel, mesh) {
        this.game = game;
        this.map = game.map;
        this.size = opts.size;
        this.hpMax = multiply(this.size, 5);
        this.appetite = Math.floor(opts.size / 4);
        this.hp = this.hpMax;
        this.age = 0;
        this.spawnPos = opts.spawnPos;
        this.name = opts.name;
        this.alive = true;
        this.lifeCycle = this.size * 4;
        this.isHerbivore = opts.isHerbivore || true;
        this.hunger = divide(this.hp, 4);
        this.vision = opts.vision || 5;
        this.speed = 1;
        this.state;
        this.social = opts.social || 10;
        this.memory = [];
        this.food = "none";
        this.parents = opts.parents;
        this.deathAge = Math.floor(this.size * 20);
        this.maturity = Math.floor(this.deathAge * 0.7);
        this.spawner = opts.spawner || false;
        this.pos = opts.pos;
        this.isFood = opts.isFood;
        this.isUser = opts.isUser || false;
        this.position = {
            x: 0,
            y: 0,
            z: 0
        };
        this.rotation = {
            x: 0,
            y: 0,
            z: 0
        };

        var self = this;

        //gives basic behavior
        angular.extend(Creature.prototype, BehaviorFactory.prototype);

        if (voxel && mesh) {
            ShapeFactory.getShape(this.name, opts.shape).then(function(data) {
                render(self, data, game, voxel, mesh, self.spawnPos);
            })
                .then(function() {
                    self.game.addEvent(function() {
                        self.exist();
                    }, 1, self.item.avatar.id);
                });
        }
        if (!game.creatures) game.creatures = [];
        if (!this.isFood) {
            game.creatures.push(this);
        }
    }



    function multiply(trait, factor) {
        return trait * factor;
    }

    function divide(trait, factor) {
        return Math.floor(trait / factor);
    }

    //render the 3D model
    function render(model, shape, game, voxel, mesh, spawnPos) {
        var rotation = shape.rotation;
        if (typeof shape !== "function") {
            var displayScale = shape.display || 0.5;
            shape = build(shape, shape.scale, game, voxel, game.mesh);
            shape.scale = new game.THREE.Vector3(displayScale, displayScale, displayScale);
        } else {
            shape = shape();
            shape.scale = new game.THREE.Vector3(0.04, 0.04, 0.04);
        }

        model.map = game.map;
        model.item = game.makePhysical(shape);
        model.item.subjectTo(game.gravity);
        model.item.avatar.castShadow = true;
        model.item.avatar.receiveShadow = true;


        var spriteMaterial = new game.THREE.SpriteMaterial({
            map: game.THREE.ImageUtils.loadTexture("../textures/boop"),
            useScreenCoordinates: false,
        });

        (function setSprite() {
            var sprite = new game.THREE.Sprite(spriteMaterial);
            sprite.scale.set(0.5, 0.5, 0.5);
            // var display ratio =
            sprite.position.set(0.5 / displayScale * 0.2, Math.max(1 / displayScale, 4), 0.5 / displayScale * 0.2);
            sprite.isFront = true;
            sprite.renderDepth = 1;

            model.item.yaw.add(sprite);
            model.sprite = sprite;
            game.scene.add(shape);
            game.addItem(model.item);
        })();


        game.scene.add(shape);
        game.addItem(model.item);



        model.position = model.item.yaw.position;
        model.rotation = model.item.yaw.rotation;
        if (rotation) {
            model.rotation.y = rotation * Math.PI;
        }
        if (spawnPos) {
            model.setPosition(spawnPos.x, 1, spawnPos.z);
        } else {
            model.setPosition(Math.floor(Math.random() * game.map.size), 10, Math.floor(Math.random() * game.map.size));

        }
    }

    function build(obj, scale, game, voxel, mesh) {
        var bounds = obj.bounds;
        var voxels = obj.voxels;
        var colors = obj.colors;

        // create voxels
        bounds[0] = bounds[0].map(function(b) {
            return b - 1;
        });
        bounds[1] = bounds[1].map(function(b) {
            return b + 1;
        });
        var voxels = generate(bounds[0], bounds[1], function(x, y, z) {
            return voxels[[x, y, z].join('|')] || 0;
        });
        // create mesh
        scale = scale || 0.2;
        var mesh = voxelMesh(voxels, game.mesher, new game.THREE.Vector3(scale, scale, scale), game.THREE);
        var mat = new game.THREE.MeshBasicMaterial({
            vertexColors: game.THREE.FaceColors
        });
        mesh.createSurfaceMesh(mat);

        // colorize
        for (var i = 0; i < mesh.surfaceMesh.geometry.faces.length; i++) {
            var face = mesh.surfaceMesh.geometry.faces[i];
            var index = Math.floor(face.color.b * 255 + face.color.g * 255 * 255 + face.color.r * 255 * 255 * 255);
            var color = colors[index] || colors[0];
            face.color.setRGB(color[0], color[1], color[2]);
        }

        function generate(l, h, f, game) {
            var d = [h[0] - l[0], h[1] - l[1], h[2] - l[2]];
            var v = new Int8Array(d[0] * d[1] * d[2]);
            var n = 0;
            for (var k = l[2]; k < h[2]; ++k)
                for (var j = l[1]; j < h[1]; ++j)
                    for (var i = l[0]; i < h[0]; ++i, ++n) {
                        v[n] = f(i, j, k, n, game);
                    }
            return {
                voxels: v,
                dims: d
            };
        }


        // center the geometry
        game.THREE.GeometryUtils.center(mesh.surfaceMesh.geometry);
        mesh.setPosition(0, 1.5, 0);

        // create creature
        var body = new game.THREE.Object3D();
        body.add(mesh.surfaceMesh);
        return body;
    }

    return {
        create: function(game, voxel, mesh) {
            return function(opts) {
                return new Creature(game, opts, voxel, mesh);
            };
        },
        render: render,
        postCoord: function(coord) {
            return $http.post('/api/coordinates', coord)
                .then(function(res) {
                    return res.data
                })
        },
        updateCoord: function(coord) {
            return $http.put('/api/coordinates/' + coord._id, coord)
                .then(function(res) {
                    return res.data
                })
        },
        postCreature: function(creature) {
            return $http.post('/api/creatures', creature)
                .then(function(res) {
                    return res.data
                })
        },
        deleteCreature: function(creature) {
            return $http.delete('/api/creatures/' + creature._id)
        }
        // currentCreatures set in one-world.ctrl
        // currentHash set in creaturescontroller
    };
})