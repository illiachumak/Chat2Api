const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const userRoute = require("./Routes/userRoute")
const chatRoute = require("./Routes/chatRoute")
const messageRoute = require("./Routes/messageRoute")
const http = require("http");
const userModel = require("./Models/userModel");

const app = express();
require("dotenv").config()
const corsOptions = {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/users", userRoute)
app.use("/api/chat", chatRoute)
app.use("/api/messages", messageRoute)

const port = 5000;

const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "*",
    }
});

app.get("/", (req, res) => {
    res.send('Hello World')
})
// sockets

io.on("connection", async(socket) => {
    console.log("a user connected", socket.id);
    
    // User sends their userID after connecting
    socket.on("setOnline", async (userId) => {
        try {
            socket.userID = userId;
            await userModel.findByIdAndUpdate(userId, { online: true, socketId: socket.id});
        } catch (err) {
            console.error("Error setting user to online:", err);
        }
    });

    socket.on("message", async ({
        msg,
        recipientUserId}) => {
        const recipientUser = await userModel.findById(recipientUserId)
        console.log(recipientUser.socketId)
        io.to(recipientUser.socketId).emit("message", msg)
    });

    socket.on("disconnect", async () => {
        console.log("a user disconnected");
        if (socket.userID) {
            try {
                // Set the user's online status to false
                await userModel.findByIdAndUpdate(socket.userID, { online: false });
            } catch (err) {
                console.error("Error setting user to offline:", err);
            }
        }
    });
});


// sockets

server.listen(port, (req, res) => {
    console.log(`App running on port:${port}`)
})

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("connected to MongoDB"))
.catch(e => console.log(e))