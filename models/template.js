const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const templateSchema = new Schema ({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    tc: {
        type: String,
        required: true,
        enum: ['T&C', 'PP']
    },
    company_name: {
        type: String,
        required: [true, 'You need a company name']
    },
    company_website: {
        type: String,
        required: [true, 'You need a company website']
    },
    country: {
        type: String,
        required: [true, 'You need a country']
    },
    policyEffeciveDate: {
        type: String,
        required: [true, 'You need a PED']
    },
    address: {
        type: String,
        required: [true, 'You need an address']
    },
    phone: {
        type: String,
        required: [true, 'You need a phone number']
    },
    email: {
        type: String,
        required: [true, 'You need an email']
    },
    industry: {
        type: String,
        required: true,
        enum: ['Generic', 'Finance', 'Tech', 'Entertainment', 'Art', 'E-Commerce']
    },
    privacy: {
        type: Boolean,
        required: true
    },
    gdrp:{
        type: Boolean,
        required: true
    },
    ads:{
        type: Boolean,
        required: true
    },
    timestamps: {
        createdAt: {type: Date},
        updatedAt: {type: Date}
    }
})

templateSchema.pre('save', function(next) {
    now = new Date();
    this.updatedAt = now;
    if (!this.createdAt) {
        this.createdAt = now;
    }
    next()
});


module.exports = mongoose.model("template", templateSchema)
