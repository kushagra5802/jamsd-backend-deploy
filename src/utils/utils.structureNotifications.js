const Grievance = require("../modules/grievance/grievance.model");
const Task = require("../modules/task/task.model");
const Report = require("../modules/report/report.model");
const RequestedReport = require("../modules/report/requestedReport.model");
const Survey = require("../modules/survey/survey.model");
const RequestedSurvey = require("../modules/survey/requestedSurvey.model");
const Ticket = require("../modules/ticket/ticket.model")
const User = require("../modules/user/user.model");
const PartyMemberModel=require("../modules/directory/directoryPartyMembers.model")
const OtherContactsModel=require("../modules/directory/directoryOtherContacts.model")
const ClientUser = require("../modules/client/clientUser.model");
const ObjectId = require('mongoose').Types.ObjectId;
const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

class StructureNotification {
    static async getSignedURL(key) {
            const params = {
                Bucket: process.env.BUCKET,
                Key: key
            };

            const command = new GetObjectCommand(params);
            let accessKeyId = process.env.ACCESS_KEY;
            let secretAccessKey = process.env.ACCESS_SECRET;
            const s3Client = new S3Client({ credentials: { accessKeyId, secretAccessKey }, region: process.env.REGION });
            return await getSignedUrl(s3Client, command, { expiresIn: 180000 });
    }

    static async structure(notificationObj, collectionObj, creatorObj) {
        const { collectionName, status } = notificationObj;
        let title;
        let content;
        let profileURL;
        let firebaseNotificationBody;
        if(collectionName === 'grievances') {
            title = "Grievance";
            if(status === "create") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} created a new grievance`;
            } else if(status === "update") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} updated the grievance`;
            } else if(status === "assigned") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} assigned you the grievance`;
                firebaseNotificationBody = {
                    notification: {
                        title: 'Task Assigned',
                        body: content,
                    },
                    data: {
                        actionType: "TASK_ASSIGNED"
                    }                        
                }
            }
            profileURL = creatorObj?.profileImageLink?.key ? await StructureNotification.getSignedURL(creatorObj.profileImageLink.key) : null;
        } else if(collectionName === 'tasks') {
            title = "Task";
            if(status === "create") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} created a new task`;
            } else if(status === "update") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} updated the new task`;
            } else if(status === "assigned") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} assigned you the task`;
            } else if(status === "unassigned") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} un-assigned the task`;
            } else if(status === "inProgress") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} started the task`;
            } else if(status === "pendingApproval") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} marked as completed the task`;
            } else if(status === "complete") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} completed the task`;
                firebaseNotificationBody = {
                    notification: {
                        title: 'Task Completed',
                        body: `${creatorObj.firstName} ${creatorObj.lastName} approved the task`
                    },
                    data: {
                        actionType: "TASK_COMPLETED"
                    }                        
                }
            } else if (status === "rejected") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} completed the task`;
                firebaseNotificationBody = {
                    notification: {
                        title: 'Task Rejected',
                        body: `${creatorObj.firstName} ${creatorObj.lastName} approved the task`
                    },
                    data: {
                        actionType: "TASK_REJECTED"
                    }                        
                }
            }
            profileURL = creatorObj?.profileImageLink?.key ? await StructureNotification.getSignedURL(creatorObj.profileImageLink.key) : null;
        } else if(collectionName === 'reports') {
            title = "Report";
            if(status === "shared") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} shared the report`;
            }
            profileURL = creatorObj?.profileImageLink?.key ? await StructureNotification.getSignedURL(creatorObj.profileImageLink.key) : null;
        } else if(collectionName === 'requestedreports') {
            title = "Requested Report";
            if(status === "requested") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} requested the report`;
            } else if(status === "fileUploaded") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} uploaded the requested report`;
            }
            profileURL = creatorObj?.profileImageLink?.key ? await StructureNotification.getSignedURL(creatorObj.profileImageLink.key) : null;
        } else if(collectionName === 'surveys') {
            title = "Survey";
            if(status === "shared") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} shared the survey`;
            }
            profileURL = creatorObj?.profileImageLink?.key ? await StructureNotification.getSignedURL(creatorObj.profileImageLink.key) : null;
        } else if(collectionName === 'requestedsurveys') {
            title = "Requested Survey";
            if(status === "requested") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} requested the survey`;
            } else if(status === "fileUploaded") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} uploaded the requested survey`;
            }
            profileURL = creatorObj?.profileImageLink?.key ? await StructureNotification.getSignedURL(creatorObj.profileImageLink.key) : null;
        } else if(collectionName === 'tickets') {
            title = "Ticket";
            if(status === "created") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} created the new ticket`;
            } else if(status === "assigned") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} assigned you the ticket`;
            } else if(status === "resolved") {
                content = `${creatorObj.firstName} ${creatorObj.lastName} resolved the ticket`;
                firebaseNotificationBody = {
                    notification: {
                        title: 'Ticket Resolved',
                        body: content,
                    },
                    data: {
                        actionType: "TICKET_RESOLVED"
                    }                        
                }
            }
            profileURL = creatorObj?.profileImageLink?.key ? await StructureNotification.getSignedURL(creatorObj.profileImageLink.key) : null;
        } else if (collectionName === 'partyDirectoryBirthdayReminders') {
            title = `Birthday Wishes!!`;
            content = `Today is Birthday of ${collectionObj?.firstName} ${collectionObj?.lastName} from your Party Directory`;
            // content = `${collectionObj?.firstName} ${collectionObj?.lastName} from your Party Directory is celebrating their birthday today.`;
            profileURL = null; // You can include profile picture logic if needed
        } else if (collectionName === 'personalBirthdayReminders') {
            title = `Birthday Wishes!!`;
            content = `Today is Birthday of ${collectionObj?.firstName} ${collectionObj?.lastName} from your Personal Directory`;
            // content = `${collectionObj?.firstName} ${collectionObj?.lastName} from your Party Directory is celebrating their birthday today.`;
            profileURL = null; // You can include profile picture logic if needed
        }
        return { title, content, profileURL, firebaseNotificationBody };
    } 

    static factoryModule(collectionName) {
        if(collectionName === 'grievances') {
            return Grievance;
        } else if(collectionName === 'tasks') {
            return Task;
        } else if(collectionName === 'reports') {
            return Report;
        } else if(collectionName === 'requestedreports') {
            return RequestedReport;
        } else if(collectionName === 'surveys') {
            return Survey;
        } else if(collectionName === 'requestedsurveys') {
            return RequestedSurvey;
        } else if(collectionName === 'tickets') {
            return Ticket;
        } else if(collectionName === 'superAdmin') {
            return User;
        } else if(collectionName === 'client') {
            return ClientUser;
        } else if(collectionName==='partyDirectoryBirthdayReminders') {
            return PartyMemberModel;
        } else if(collectionName==='personalBirthdayReminders') {
            return OtherContactsModel;
        }
    }

    static async retriveObj(collectionName, documentId) {
        const Model = await StructureNotification.factoryModule(collectionName);
        // console.log('Model', Model)
        if(!collectionName === 'grievances' && !collectionName === 'tasks') {
            documentId = ObjectId(documentId)
        }
        const CollectionObject = await Model.findOne({ _id: documentId })
        // console.log("Collection obj:",CollectionObject)
        return CollectionObject;
    }

    static async createNotification(notificationObj) {
        for await(const notification of notificationObj) {
            // console.log('notification', notification)
            const { collectionName, documentId, creatorType, creator } = notification;
            const contentObject = await StructureNotification.retriveObj(collectionName, documentId);
            // console.log("Content Obj",contentObject)
            const creatorObj = await StructureNotification.retriveObj(creatorType, creator);
            // console.log("Creator Obj",creatorObj)
            const { title, content, profileURL, firebaseNotificationBody } = await StructureNotification.structure(notification, contentObject, creatorObj);
            // console.log("Title",title)
            // console.log("Content",content)
            notification.title = title;
            notification.content = content;
            notification.profileURL = profileURL;
            notification.firebaseNotificationBody = firebaseNotificationBody || {};
        }
        return notificationObj;
    }
  }
  
  module.exports = StructureNotification;
  