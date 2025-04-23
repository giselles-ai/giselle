import type React from "react";

interface ShinyTextProps {
    text: string;
    disabled?: boolean;
    speed?: number;
    className?: string;
    style?: React.CSSProperties;
}

const ShinyText: React.FC<ShinyTextProps> = ({
    text,
    disabled = false,
    speed = 5,
    className = "",
    style = {},
}) => {
    const animationDuration = `${speed}s`;

    return (
        <div
            className={`bg-clip-text inline-block ${disabled ? "" : "animate-shine"} ${className}`}
            style={{
                backgroundImage: "linear-gradient(120deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 60%)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animationDuration: animationDuration,
                ...style,
            }}
        >
            {text}
        </div>
    );
};

export default ShinyText; 