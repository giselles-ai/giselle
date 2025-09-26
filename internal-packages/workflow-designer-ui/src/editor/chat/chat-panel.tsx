"use client";

import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { validateUrl } from "../lib/validate-url";

interface Message {
	id: string;
	content: string;
	sender: "assistant" | "user";
	timestamp: Date;
}

// Normalize and validate a URL for link usage (http/https only). Returns URL or null.
function toSafeLinkUrl(raw: string): URL | null {
	return validateUrl(raw);
}

// Function to render message content with URL styling
const renderMessageWithUrls = (content: string) => {
	const urlRegex = /(https?:\/\/[^\s]+)/;
	const parts = content.split(urlRegex);

	return parts.map((part, index) => {
		if (urlRegex.test(part)) {
			const safeUrl = toSafeLinkUrl(part);
			if (!safeUrl) return part;
			const href = safeUrl.toString();

			// Truncate long URLs for display based on original text (trimmed)
			const displaySource = part.trim();
			const displayUrl =
				displaySource.length > 50
					? `${displaySource.substring(0, 30)}...${displaySource.substring(displaySource.length - 15)}`
					: displaySource;
			return (
				<a
					key={`url-${index}-${part.substring(0, 10)}`}
					href={href}
					target="_blank"
					rel="noopener noreferrer"
					title={displayUrl}
					className="underline text-[#6B8FF0] hover:text-[#5A7EE8] transition-colors duration-200 break-all"
				>
					{displayUrl}
				</a>
			);
		}
		return part;
	});
};

export function ChatPanel() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [showTyping, setShowTyping] = useState(true);
	const [isThinking, setIsThinking] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	// Demo message patterns
	const demoMessages = [
		// Long message
		"Thanks for your question! I'll help you with that. For more information about nodes, check out our documentation at https://docs.giselles.ai/nodes or visit our GitHub repository at https://github.com/giselles-ai/giselle for examples. You can also explore different node types, configure their settings, and connect them to build powerful workflows. Feel free to experiment with the visual editor and don't hesitate to ask if you need guidance!",
		// Short message
		"Got it! Check our docs at https://docs.giselles.ai/nodes for more info.",
		// Greeting message
		"Hello! 👋 I'm here to help you with your workflow. What would you like to know about nodes and connections?",
	];

	// Show typing indicator and then welcome message
	useEffect(() => {
		const timer = setTimeout(() => {
			setShowTyping(false);
			const welcomeMessage: Message = {
				id: `welcome-${Date.now()}`,
				content: "Not sure how to use something? Just ask me anything!",
				sender: "assistant",
				timestamp: new Date(),
			};
			setMessages([welcomeMessage]);

			// Focus input after message appears
			setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
		}, 2000);

		return () => clearTimeout(timer);
	}, []);

	// Scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	});

	const handleSendMessage = () => {
		if (!inputValue.trim()) return;

		const userMessage: Message = {
			id: `user-${Date.now()}`,
			content: inputValue.trim(),
			sender: "user",
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInputValue("");

		// Show thinking message
		setTimeout(() => {
			const thinkingMessage: Message = {
				id: `thinking-${Date.now()}`,
				content: "Thinking about it—just a moment!",
				sender: "assistant",
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, thinkingMessage]);

			// Show typing indicator
			setTimeout(() => {
				setIsThinking(true);

				// Show final response
				setTimeout(() => {
					setIsThinking(false);
					const randomMessage =
						demoMessages[Math.floor(Math.random() * demoMessages.length)];
					const assistantMessage: Message = {
						id: `assistant-${Date.now()}`,
						content: randomMessage,
						sender: "assistant",
						timestamp: new Date(),
					};
					setMessages((prev) => [...prev, assistantMessage]);
				}, 2000);
			}, 1000);
		}, 500);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInputValue(e.target.value);
		// Auto-resize textarea
		const textarea = e.target;
		textarea.style.height = "auto";
		textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
	};

	return (
		<div className="h-[600px] w-[320px] flex flex-col relative">
			{/* Header */}

			{/* Messages Area */}
			<div className="flex-1 overflow-y-auto py-2 px-4 flex flex-col relative thin-scrollbar mask-fade-b">
				<div className="flex-grow" />
				<div className="flex flex-col space-y-2 min-h-fit">
					{messages.map((message, _index) => {
						return (
							<div
								key={message.id}
								className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
							>
								<div
									className={`max-w-[80%] min-w-0 px-4 py-3 text-sm font-mono ${
										message.sender === "user"
											? "font-light bg-[#4A6FD8] text-white rounded-[8px] rounded-br-[4px] shadow-sm"
											: "font-light bg-[#6B8FF0]/20 text-white rounded-[8px] rounded-bl-[4px] border border-[#6B8FF0]/80 shadow-[0_0_10px_rgba(107,143,240,0.3),0_0_20px_rgba(107,143,240,0.2),inset_0_0_20px_rgba(107,143,240,0.1)] backdrop-blur-sm animate-slide-up-left"
									}`}
								>
									<div className="whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere">
										{renderMessageWithUrls(message.content)}
									</div>
								</div>
							</div>
						);
					})}

					{/* Typing indicator */}
					{(showTyping || isThinking) && (
						<div className="flex justify-start">
							<div className="bg-[#6B8FF0]/20 text-white rounded-[8px] rounded-bl-[4px] px-4 py-3 border border-[#6B8FF0]/80 shadow-[0_0_10px_rgba(107,143,240,0.3),0_0_20px_rgba(107,143,240,0.2),inset_0_0_20px_rgba(107,143,240,0.1)] backdrop-blur-sm font-mono font-light">
								<div className="flex items-center space-x-1">
									<div className="flex space-x-1">
										<div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
										<div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce animate-delay-100"></div>
										<div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce animate-delay-200"></div>
									</div>
								</div>
							</div>
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>
			</div>

			{/* Input Area */}
			<div className="p-2 flex-shrink-0">
				<div className="relative">
					<textarea
						ref={inputRef}
						value={inputValue}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						placeholder="Ask about your workflow..."
						rows={1}
						className="w-full bg-black-700/80 border border-white/20 rounded-[8px] px-3 py-2 pr-12 text-white-900 placeholder-white-600 text-sm font-mono font-light focus:outline-none focus:ring-1 focus:ring-[#6B8FF0] focus:border-transparent resize-none min-h-[40px] max-h-[120px] overflow-y-auto"
					/>
					<button
						type="button"
						onClick={handleSendMessage}
						disabled={!inputValue.trim()}
						className={`absolute right-2 bottom-2 p-2 rounded-full transition-colors ${
							inputValue.trim()
								? "bg-transparent text-[#6B8FF0] hover:text-[#5A7EE8]"
								: "bg-transparent text-white-600/50 cursor-not-allowed"
						}`}
					>
						<Send className="w-4 h-4" />
					</button>
				</div>
				<div className="text-left -mt-1">
					<span className="text-[10px] text-gray-500">
						Chat will reset when closed •{" "}
						<span className="inline-block px-0.5 text-[9px] text-gray-300 rounded border border-gray-600 font-mono">
							Esc
						</span>
					</span>
				</div>
			</div>
		</div>
	);
}
