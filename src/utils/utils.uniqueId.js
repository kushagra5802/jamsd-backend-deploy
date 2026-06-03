
class UniqueId {
    //unique id with prefix as parameter
    static create_UUID(prefix) {
        var dt = new Date().getTime();
        var uuid = `${prefix}-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, function (c) {
            var r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }


    static create_date_based_id(prefix) {
        let now = new Date();
        
        let dateStr = now.toISOString().replace(/[-T:.Z]/g, "").slice(2, 14); // YYMMDDHHmmss
        let randomStr = Math.floor(Math.random() * 9000 + 1000).toString(); // 4-digit random number
        
        return `${prefix}-${dateStr}${randomStr}`;
    }
    

    static create_password(prefix) {
        var dt = new Date().getTime();
        var password = `${prefix}xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx`.replace(/[xy]/g, function (c) {
            var r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return password;
    }

    // console.log('Unique id is: ',create_UUID('pol'));

}

module.exports = UniqueId;
