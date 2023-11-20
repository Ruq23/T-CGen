const express = require('express');
const router = express.Router();

const catchAsync = require('../utilities/catchAsync')

const User = require('../models/user');
const Template = require('../models/template');
const { verifyToken, isLoggedIn } = require('../middleware');


//Templates
const tcs = ['T&C', 'PP']

router.get('/', (req, res) => {
    console.log(req.session)
     if(req.session.user_id){
         console.log('Up and running')
     } else console.log('Not Working') 
     res.render('landing.ejs', {session})
     
 })

router.get('/newtc', isLoggedIn, catchAsync(async(req, res, next) => {
    res.render('newtc', {tcs})
    console.log(req.session.user_id)
    console.log(req.session)

}))

router.post('/index', isLoggedIn, catchAsync(async(req, res, next) => {
    const { tc, company_name, company_website, country, policyEffeciveDate, address, phone, email, industry, privacy, gdrp, ads } = req.body

    const template = await Template.create({
        tc: 'T&C',
        company_name,
        company_website,
        country,
        policyEffeciveDate,
        address,
        phone,
        email: email.toLowerCase(),
        industry,
        privacy: req.body.privacy ? true: false,
        gdrp: req.body.gdrp ? true: false,
        ads: req.body.ads ? true: false,
        author: req.session.user_id
    })
    console.log(tc)
    res.redirect(`myTemplates/${template._id}`)
}))

router.get('/newpp', isLoggedIn, catchAsync(async(req, res, next) => {
    res.render('newpp', {tcs})
    console.log(req.session.user_id)
    console.log(req.session)

}))

router.post('/indexx', isLoggedIn, catchAsync(async(req, res, next) => {
    const { tc, company_name, company_website, country, policyEffeciveDate, address, phone, email, industry, privacy, gdrp, ads } = req.body

    const template = await Template.create({
        tc: 'PP',
        company_name,
        company_website,
        country,
        policyEffeciveDate,
        address,
        phone,
        email: email.toLowerCase(),
        industry,
        privacy: req.body.privacy ? true: false,
        gdrp: req.body.gdrp ? true: false,
        ads: req.body.ads ? true: false,
        author: req.session.user_id
    })
    console.log(tc)
    res.redirect(`myTemplates/${template._id}`)
}))

router.get('/myTemplates', isLoggedIn, catchAsync(async(req, res, next) => {
    const templates = await Template.find({ author: req.session.user_id })
    console.log(templates)
    console.log(req.session.user_id)
    res.render('templates', { templates })
}))

router.get('/ppTemplates', isLoggedIn, catchAsync(async(req, res, next) => {
    const templates = await Template.find({ author: req.session.user_id })
    console.log(templates)
    console.log(req.session.user_id)
    res.render('pp_template', { templates })
}))

router.get('/tcTemplates', isLoggedIn, catchAsync(async(req, res, next) => {
    const templates = await Template.find({ author: req.session.user_id })
    console.log(templates)
    console.log(req.session.user_id)
    res.render('tc_template', { templates })
}))

router.get('/myTemplates/:id', isLoggedIn, catchAsync(async(req, res) => {
    const { id } = req.params
    const template = await Template.findById(id)
    console.log(template)
    res.render('show', { template})
}))

router.delete('/myTemplates/:id', isLoggedIn, catchAsync(async(req, res) => {
    const { id } = req.params
    const deleteTemplate = await Template.findByIdAndDelete(id)
    res.redirect('/myTemplates')
}))

router.get('/myTemplates/:id/edit',isLoggedIn, catchAsync(async(req, res) => {
    const { id } = req.params
    const template = await Template.findById(id)
    console.log(template)
    res.render('edit', { template})
}))

router.put('/myTemplates/:id',isLoggedIn, catchAsync(async(req, res) => {
    const { id } = req.params
    const template = await Template.findByIdAndUpdate(id, req.body)
    res.redirect(`/myTemplates/${template._id}`)

}))


router.get('/dashboard/:id',isLoggedIn, catchAsync( async(req, res) => {
    const { id } = req.params 
    const user = await User.findById(id)
    console.log(user)
    res.render('dashboard.ejs', { user })
}))


module.exports = router;