import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: true
    },
    members: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'members.userType'
        },
        userType: {
            type: String,
            enum: ['Student', 'Faculty'],
            required: true
        },
        userName: String,
        rollNumber: String,
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        lastReadAt: {
            type: Date,
            default: Date.now
        },
        isMuted: {
            type: Boolean,
            default: false
        }
    }],
    filters: {
        year: [Number],
        branch: [String],
        section: [String]
    },
    settings: {
        allowStudentMessages: {
            type: Boolean,
            default: true
        },
        allowFileSharing: {
            type: Boolean,
            default: true
        },
        allowMentions: {
            type: Boolean,
            default: true
        },
        allowFreeLeave: {
            type: Boolean,
            default: false
        }
    },
    stats: {
        totalMemberCount: {
            type: Number,
            default: 0
        },
        messageCount: {
            type: Number,
            default: 0
        },
        fileCount: {
            type: Number,
            default: 0
        }
    },
    lastMessage: {
        content: String,
        senderName: String,
        sentAt: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// ========== INDEXES ==========
groupSchema.index({ createdBy: 1 });
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ isActive: 1 });
groupSchema.index({ createdAt: -1 });

// ========== INSTANCE METHODS ==========

// Check if user is member
groupSchema.methods.isMember = function(userId) {
    if (!userId) {
        console.error('❌ isMember called with undefined userId');
        return false;
    }
    
    if (!this.members || this.members.length === 0) {
        console.error('❌ Group has no members');
        return false;
    }
    
    const userIdStr = userId.toString();
    return this.members.some(m => {
        if (!m.userId) {
            console.error('❌ Member has undefined userId');
            return false;
        }
        return m.userId.toString() === userIdStr;
    });
};

// Check if user is creator
groupSchema.methods.isCreator = function(userId) {
    if (!userId || !this.createdBy) return false;
    return this.createdBy.toString() === userId.toString();
};

// Check if user is admin
groupSchema.methods.isAdmin = function(userId) {
    const member = this.members.find(m => m.userId.toString() === userId.toString());
    return member ? member.role === 'admin' : false;
};

// Update last message
groupSchema.methods.updateLastMessage = function(message) {
    this.lastMessage = {
        content: message.content,
        senderName: message.senderName,
        sentAt: message.createdAt
    };
};

// Update last read timestamp
groupSchema.methods.updateLastRead = function(userId) {
    const member = this.members.find(m => m.userId.toString() === userId.toString());
    if (member) {
        member.lastReadAt = new Date();
    }
};

groupSchema.methods.getUnreadCount = function(userId) {
    // For now, return 0
    // TODO: Implement actual unread count calculation
    return 0;
};

// ========== STATIC METHODS ==========

// Get groups for faculty
groupSchema.statics.getGroupsForFaculty = async function(facultyId) {
    return this.find({
        createdBy: facultyId,
        isActive: true
    }).sort({ updatedAt: -1 });
};

// Get groups for student
groupSchema.statics.getGroupsForStudent = async function(studentId) {
    return this.find({
        'members.userId': studentId,
        'members.userType': 'Student',
        isActive: true
    }).sort({ updatedAt: -1 });
};

// Search groups
groupSchema.statics.searchByName = async function(searchTerm, userId) {
    return this.find({
        name: { $regex: searchTerm, $options: 'i' },
        'members.userId': userId,
        isActive: true
    }).sort({ name: 1 });
};

// ========== PRE SAVE MIDDLEWARE ==========
groupSchema.pre('save', function(next) {
    this.stats.totalMemberCount = this.members.length;
    next();
});

export const Group = mongoose.model('Group', groupSchema);