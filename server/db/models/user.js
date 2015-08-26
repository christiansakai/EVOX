'use strict';
var crypto = require('crypto');
var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate')(mongoose);

var userSchema = new mongoose.Schema({
    name: {
        first: String,
        last: String
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    salt: {
        type: String
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    worlds: [{
        name: {
            type: mongoose.Schema.ObjectId,
            ref: 'World'
        },
        creature: {
            type: mongoose.Schema.ObjectId,
            ref: 'Creature'
        }
    }],
    creature: [{
        // name: String,
        creature: {
            type: mongoose.Schema.ObjectId,
            ref: 'Creature'
        },
        shape: {
            type: mongoose.Schema.ObjectId,
            ref: 'Shape'
        },
        // vision: Number,
        // category: String,
        // size: Number,
        levels: {
            1: {
                type: Boolean,
                default: false
            },
            2: {
                type: Boolean,
                default: false
            },
            3: {
                type: Boolean,
                default: false
            },
            4: {
                type: Boolean,
                default: false
            },
            5: {
                type: Boolean,
                default: false
            },
            6: {
                type: Boolean,
                default: false
            }
        }
    }]
});

userSchema.plugin(deepPopulate, {});

// generateSalt, encryptPassword and the pre 'save' and 'correctPassword' operations
// are all used for local authentication security.
var generateSalt = function() {
    return crypto.randomBytes(16).toString('base64');
};

var encryptPassword = function(plainText, salt) {
    var hash = crypto.createHash('sha1');
    hash.update(plainText);
    hash.update(salt);
    return hash.digest('hex');
};

userSchema.pre('save', function(next) {

    if (this.isModified('password')) {
        this.salt = this.constructor.generateSalt();
        this.password = this.constructor.encryptPassword(this.password, this.salt);
    }

    next();

});

userSchema.statics.generateSalt = generateSalt;
userSchema.statics.encryptPassword = encryptPassword;

userSchema.method('correctPassword', function(candidatePassword) {
    return encryptPassword(candidatePassword, this.salt) === this.password;
});

mongoose.model('User', userSchema);