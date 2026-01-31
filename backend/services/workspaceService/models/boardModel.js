import mongoose from "mongoose";

const Schema = mongoose.Schema;

export const subtasksSchema = new Schema({
  subtaskName: {type: String,required: true},
  subTaskDescription: { type: String},
  isCompleted: { type: Boolean, default: false },
}, { _id: true });

export const tasksSchema = new Schema({
  taskName: { type: String, required: true,},
  taskDescription: { type: String,},
  subtasks: [
    {
      type: subtasksSchema,
    },
    
  ],
  status: {type: String,required: true},
  assignee: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserView' }],
  reporter: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserView' }],
  priorityLevel: { type: String,enum: ['low', 'medium', 'high'], default: 'medium', },
  attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileType: { type: String },
        fileSize: { type: Number },
        uploadedBy: { type: Schema.Types.ObjectId, ref: "UserView" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  activities: [
    {
      type: { type: String, default: ""},
      activity: String,
      date: { type: Date, default: new Date() },
      by: { type: Schema.Types.ObjectId, ref: "UserView" },
    },
  ],
  comments: { type: String, index: true },
  relatedTaskIDs: [{ type: Schema.Types.ObjectId }],
  isTrashed:{type:Boolean, default:false},
},
{timestamps:true}
);


export const columnSchema = new Schema({
  columnName: {
    type: String,
    required: true,
  },
  tasks: [
    {
      type: tasksSchema,
    },
  ],
});

export const boardSchema = new Schema({
  boardName: { type: String, required: true,},
  columns: [
    { type: columnSchema,},],
  
  members: [
    {
      user: { type: Schema.Types.ObjectId, ref: "UserView", required: true },
      userId: { type: Schema.Types.ObjectId },
      role: { type: String, enum: ["owner", "admin", "editor", "viewer", "contributor"], default: "editor" },
      addedAt: { type: Date, default: Date.now }
    }
  ],
  projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },

},
{timestamps:true}
);
const projectBoardsSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
  boards: [boardSchema],
},
{timestamps:true}
);

export const ProjectBoards = mongoose.model("ProjectBoards", projectBoardsSchema);

