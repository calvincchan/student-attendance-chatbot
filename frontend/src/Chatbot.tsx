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
    const res = await axios.post("/chat", {
      text: userInput,
    });
    const { data } = res;
    if (data?.status === "OK") {
      return data.result.toString();
    } else {
      return "Sorry, I don't understand.";
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

  const firstMessage = `
  ## Welcome to the chatbot!
  You can test the chatbot with the following messages:
  - Hello, What's the default homeroom and today's date?
  - Everyone is here today, except Mason is sick.
  - Show the records for December 2023.
  - Show the records for this month.
  - 今天所有人都出席。
  - 今天所有人都出席，除了 Mason 生病了。
  - 顯示 2023 年 12 月的記錄。
  - 顯示這個月的記錄。
`;

  return (
    <div className="chatbot-container">
      <div className="chatbot-messages">
        <div className="message ai-message">
          <Markdown>{firstMessage}</Markdown>
        </div>
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
