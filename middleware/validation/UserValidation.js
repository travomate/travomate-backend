const {check, validationResult} = require('express-validator')

// user creation (signUp) validation
exports.validateUserSignUp = [
    check('firstName')
    .trim()
    .not()
    .isEmpty()
    .withMessage('firstName is required!')
    .isString()
    .withMessage('must be a valid name!')
    .isLength({min:3, max:20})
    .withMessage('firstName must be within 3 to 20 characters!'),

    check('lastName')
    .trim()
    .not()
    .isEmpty()
    .withMessage('lastName is required!')
    .isString()
    .withMessage('must be a valid name!')
    .isLength({min:3, max:20})
    .withMessage('lastName must be within 3 to 20 characters!'),


    check('email')
    .normalizeEmail()
    .isEmail()
    .withMessage('Invalid email'),


    check('password')
    .trim()
    .not()
    .isEmpty()
    .withMessage('password is empty')
    .isLength({min:8, max:20})
    .withMessage('passwod must be 8 to 20 characters long!'),


    check('repeatPassword')
    .trim()
    .not()
    .isEmpty()
    .withMessage('repeatPassword is empty')
    .custom((value, {req})=>{
        if(value !== req.body.password){
            throw new Error('Both password must be the same!')
        }
        return true;
    }
    )

]

// checking if there is any validation error

exports.userValidation = (req, res, next) =>{
    const results = validationResult(req).array()
    if(!results.length) return next(); //if result.length is not there it means there is no error then go to next() function

    const error = results[0].msg; // if there is error 1st index, grab a msg
    res.json({ success: false, message: error });  // by using res.json we are sending error to the frontEnd
}; 

// user sign in validation

exports.validateUserSignIn = [
    check('email')
    .trim()
    .isEmail()
    .withMessage('email / password is required'),

    check('password')
    .trim()
    .not()
    .isEmpty()
    .withMessage('email / password is required'),
    

]
