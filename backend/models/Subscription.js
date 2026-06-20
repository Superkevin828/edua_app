const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['free', 'pro', 'premium'],
        required: true,
        unique: true
    },
    price: {
        monthly: {
            type: Number,
            default: 0
        },
        yearly: {
            type: Number,
            default: 0
        }
    },
    features: [{
        name: String,
        included: {
            type: Boolean,
            default: true
        }
    }],
    courseLimit: {
        type: Number,
        default: -1 // -1 means unlimited
    },
    lessonLimit: {
        type: Number,
        default: -1
    },
    hasCertificates: {
        type: Boolean,
        default: false
    },
    hasPrioritySupport: {
        type: Boolean,
        default: false
    },
    hasExclusiveContent: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
