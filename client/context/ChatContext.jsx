import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios } = useContext(AuthContext);

  //Get all users for sidebar
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");

      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log("GET USERS ERROR:", error.response?.data);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // function to Get message to selected user
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);

      console.log("GET MESSAGES RESPONSE:", data);

      if (data.success) {
        setMessages(data.messages || []);
      } else {
        toast.error(data.message);
        setMessages([]);
      }
    } catch (error) {
      console.error("GET MESSAGES ERROR:", error);
      console.error("SERVER RESPONSE:", error.response?.data);

      toast.error(error.response?.data?.message || error.message);
    }
  };
  // function to send message to selected user
  // const sendMessage = async (messageData) => {
  //   try {
  //     const { data } = await axios.post(
  //       `/api/messages/send/${selectedUser._id}`,
  //       messageData,
  //     );
  //     if (data.success) {
  //       setMessages((prevMessages) => [...prevMessages, data.newMessage]);
  //     } else {
  //       toast.error(data.message);
  //     }
  //   } catch (error) {
  //     toast.error(error.message);
  //   }
  // };
  const sendMessage = async (messageData) => {
    try {
      console.log("SENDING MESSAGE:", messageData);
      console.log("SELECTED USER:", selectedUser);

      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData,
      );

      console.log("SEND MESSAGE RESPONSE:", data);

      if (data.success && data.newMessage) {
        setMessages((prevMessages) => [...prevMessages, data.newMessage]);
      } else if (!data.success) {
        toast.error(data.message);
      } else {
        console.error("Backend did not return newMessage:", data);
        toast.error("Message was sent but no message data was returned");
      }
    } catch (error) {
      console.error("SEND MESSAGE ERROR:", error);
      console.error("SERVER RESPONSE:", error.response?.data);

      toast.error(error.response?.data?.message || error.message);
    }
  };

  // fuction to subscribe to messages for selected user
  const subscribeToMessages = async () => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        newMessage.seen = true;
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        setUnseenMessages((prevUnseenMessages) => ({
          ...prevUnseenMessages,
          [newMessage.senderId]: prevUnseenMessages[newMessage.senderId]
            ? prevUnseenMessages[newMessage.senderId] + 1
            : 1,
        }));
      }
    });
  };

  // fuction to Unsubscribe to messages
  const unsubscribeFromMessage = () => {
    if (socket) socket.off("newMessage");
  };

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessage();
  }, [socket, selectedUser]);

  const value = {
    messages,
    users,
    selectedUser,
    getUsers,
    getMessages,
    sendMessage,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
