import axios from "axios";
import { FormEventHandler, useEffect, useState } from "react";
import Markdown from "react-markdown";
import "./Chatbot.css";

interface IMessage {
  text: string;
  user: boolean;
}

const Chatbot = () => {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<IMessage[]>([]);

  const chatWithGPT = async (userInput: string) => {
    const res = await axios.post("http://127.0.0.1:3001/chat", {
      text: userInput,
    });
    const { data } = res;
    if (data?.status === "OK") {
      return "🤖" + data.result;
    } else {
      return "🤖💔 Sorry, I don't understand.";
    }
  };

  const handleSubmit: FormEventHandler = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage: IMessage = { text: input, user: true };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    const aiMessage = { text: "...", user: false };
    setMessages((prevMessages) => [...prevMessages, aiMessage]);
    const response = await chatWithGPT(input);
    const newAiMessage = { text: response, user: false };
    setMessages((prevMessages) => [...prevMessages.slice(0, -1), newAiMessage]);
    setInput("");
  };

  useEffect(() => {
    async function firstMessage() {
      const response = await chatWithGPT(
        "Hello, What's the default homeroom and today's date?"
      );
      const newAiMessage = { text: response, user: false };
      setMessages((prevMessages) => [...prevMessages, newAiMessage]);
    }
    firstMessage();
  }, []);

  return (
    <div className="chatbot-container">
      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${
              message.user ? "user-message" : "ai-message"
            }`}
          >
            <Markdown>{message.text}</Markdown>
          </div>
        ))}
      </div>
      <form className="chatbot-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};
export default Chatbot;
