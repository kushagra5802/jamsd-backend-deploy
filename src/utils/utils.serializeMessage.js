

class SerializeMessage {
    static serializeMessage(m) {
        return {
            _id: String(m._id),
            conversation: String(m.conversation),
            sender: String(m.sender),
            type: m.type,
            text: m.text,
            attachments: m.attachments || [],
            metadata: m.metadata || {},
            statuses: (m.statuses || []).map((s) => ({ user: String(s.user), deliveredAt: s.deliveredAt, seenAt: s.seenAt })),
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
        };
     }
}

module.exports = SerializeMessage;