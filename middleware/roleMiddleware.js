

async function roleMiddleware(req,res,next){
    try {
        const user=req.user;
        if(user.role!=="admin" && user.role!=="super_admin"){
            return res.status(401).json({message:"You are not allowed to access this resource."});
        }
        if(user.role==="admin" && req.body.user_type==="super_admin"){
            return res.status(401).json({message:"You are not allowed to create this user"});
        }

        next();
    } catch (error) {
        return res.status(500).json({message:"Something went wrong. Try again later."});
    }
}

module.exports={roleMiddleware};