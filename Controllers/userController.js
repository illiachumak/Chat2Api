const userModel = require("../Models/userModel")
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken")

const createToken = (_id) => {
    const jwtKey = process.env.JWT_SECRET;

    return jwt.sign({_id}, jwtKey, {expiresIn: "3d"})
}

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try{
        let user = await userModel.findOne({ email });

        if(!user) return res.status(400).json("Invalid email!")

        const isValidPassword = await bcrypt.compare(password, user.password);

        if(!isValidPassword) return res.status(400).json("Invalid password!")
        
        const token = createToken(user._id);
    
        res.status(200).json({_id: user._id, name: user.name, token })
    }catch(error){
        console.log(error);
        res.status(500).json(error)
    }

}

const registerUser = async (req, res) => {

    try{
        const { name, email, password } = req.body;
    
        let user = await userModel.findOne({ email });
    
        if ( !name || !email || !password ) return res.status(400).json(`Please fill all the fields!`)
    
        if ( user ) return res.status(400).json('This email has been already used!')
    
        if( !validator.isEmail(email) ) return res.status(400).json('Email link is not correct!')
    
        if( !validator.isStrongPassword(password) ) return res.status(400).json('Password is too simple!')
    
        user = new userModel({
            name,
            email,
            password
        })
    
         const salt = await bcrypt.genSalt(10);
         user.password = await bcrypt.hash(user.password, salt)
    
         await user.save();
    
         const token = createToken(user._id);
    
         res.status(200).json({_id: user._id, name, token, email})

    } catch(error){

        console.log(error);
        res.status(500).json(error)

    }

}

const findUser = async (req, res) => {
    const { userId } = req.params;

    try{
        const user = await userModel.findById(userId);

        res.status(200).json(user)
    }catch(error){
        console.log(error);
        res.status(500).json(error)
    }
}

const getUsers = async (req, res) => {
    try{
        const users = await userModel.find();

        res.status(200).json(users)
    }catch(error){
        console.log(error);
        res.status(500).json(error)
    }
}

module.exports = {registerUser, loginUser, findUser, getUsers};
