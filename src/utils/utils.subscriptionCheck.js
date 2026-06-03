const subscriptions = {
    basic: {
        gmsClients: false,
        constituencyMap: true,
        users: true,
        cadreManagement : true,
        reports: false,
        insights : false,
        survey: false,
        perception : false,
        customerSupport : false
    },
    advanced: {
        gmsClients: true,
        constituencyMap: true,
        users: true,
        cadreManagement : true,
        reports: true,
        insights : true,
        survey: true,
        perception : false,
        customerSupport : false
    },
    customized: {
        gmsClients: true,
        constituencyMap: true,
        users: true,
        cadreManagement : true,
        reports: true,
        insights : true,
        survey: true,
        perception : true,
        customerSupport : true
    }
}

class SubscriptionCheck{

    static checkSubscription(req,res,next){
        const {subscription} = req.headers;
        
        if(!subscription || !subscriptions[subscription]){
            return res.status(401).json({message: 'Invalid Plan'});
        }
        const subscriptionPermission = subscriptions[subscription];
       
        const apiRoute = req.baseUrl.substring(1).split('/')[1];

        const apiAllowed = Object.entries(subscriptionPermission).filter(([api,allowed]) => allowed)
                            .map(([api]) => api).includes(apiRoute);
        
        
        if(!apiAllowed){
            return res.status(403).json({message: 'Unauthorized Api Access'});
        }
        next();
    }

}
module.exports = SubscriptionCheck;