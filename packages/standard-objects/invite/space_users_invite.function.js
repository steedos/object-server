const objectql = require('@steedos/objectql');
module.exports = {
    invite_token: async function(req, res){
        const userSession = req.user;
        if(!userSession.is_space_admin){
            res.send({error: 'No permission'})
        }
        const record = await objectql.getObject('space_users_invite').find({filters: [['space', '=', userSession.spaceId], ['valid', '=', true]]})
        if(record.length > 0 ){
            res.send({token: record[0]._id})
        }else{
            const result = await objectql.getObject('space_users_invite').insert({valid: true, space: userSession.spaceId}, userSession);
            if(result){
                res.send({token: result._id})
            }
        }
    }
  }