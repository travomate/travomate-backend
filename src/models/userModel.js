const mongoose = require('mongoose');
const bcrypt = require('bcrypt')


const userSchema = new mongoose.Schema({
 
  firstName:{ //modified (name)
    type:String ,
    required: true,
  },  
  lastName:{ //modified (name)
    type:String ,
    required: true,
  }, 
  Title: {
    type: String,
    enum: ['Mister','Miss'],
    // make it required
  }, 
  email: { 
    type: String,
    unique: true,
    required: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: true,
  }, 
  profilePhoto: {
    type:String
  }, 
  identityDocPhoto: {
    type: String,
  },
  identityDocType: {
    type: String,
    enum: ['ID card','Passport']
  },
  isIdentityDocVerified: {
    type: Boolean,
    default: false
  },
  phoneNumber: {
    type: String,
  },
  isPhoneNumberVerified: {
    type: Boolean,
    default: false
  },
  faceBookAccount: {
    type: String,
  },
  isFaceBookAccountVerified: {
    type: Boolean,
    default: false
  },
  addresss:{ 
    type:String
  },
  gender: {
    type: String,
    enum: ['male','female']
  },
  birthDate:{ 
    type:Date
  },
  nationality:{ 
    type:String
  },
  preferredCurrency:{ 
    type:String,
    default: 'USD'
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isVerifiedTicket: {
    type: Boolean,
    default: true,
  },
  memberSince: {
    type: Date,
    default: Date.now,
  },

  trips: [{
    type: mongoose.Types.ObjectId,
    ref: 'Flight',
    required: true
  }],
  bookings: [
    {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  ],

  tokens:[{type: Object}]
  
},{ timestamps: true });

// hashing password

// run this function before saving the user to DB,
userSchema.pre('save', function (next) {
  if (this.isModified('password')) { //check if psw is modified, i.e we want to run this logic if there is any change to this psw
    bcrypt.hash(this.password, 8, (err, hash) => { 
      if (err) return next(err);

      this.password = hash;
      next();
    });
  }
}); 
//method to compare psw
userSchema.methods.comparePassword = async function (password) {
  if (!password) throw new Error('Password is mission, can not compare!');

  try {
    const result = await bcrypt.compare(password, this.password);
    return result;
  } catch (error) {
    console.log('Error while comparing password!', error.message);
  }
};



// checking if email is unique, to prevent duplications

// EMAIL function check
userSchema.statics.isThisEmailInUse = async function (email) {
  if (!email) throw new Error('Invalid Email');
  try {
    const user = await this.findOne({ email });
    if (user) return false;

    return true;
  } catch (error) {
    console.log('error inside isThisEmailInUse method', error.message);
    return false;
  }
};



const User = mongoose.model('User', userSchema);

module.exports = User;
