"use client";
import vapi from "@/lib/vapi.sdk";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { interviewer } from "@/constants";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}
interface AgentProps {
  userName: string;
  userId: string;
  type: string;
}

interface AgentProps {
  userName: string;
  userId: string;
  type: string;
  questions: string[]; // Added questions property
  interviewId: string;
}

const Agent = ({
  userName,
  userId,
  type,
  questions,
  interviewId,
}: AgentProps) => {
  const router = useRouter();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
    const onCallEnd = () => setCallStatus(CallStatus.FINISHED);
    const onMessage = (message: Message) => {
      // VAPI transcript type can be "final"/"partial"
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };
    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);
    const onError = (error: any) =>
      setError(error?.message ?? "Unknown VAPI Error");

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  const handleGenerateFeedback = async (messages: SavedMessage[]) => {
    console.log("Generate Feedback here.");
    const { success, id } = {
      success: true,
      id: "feedback-id",
    };
    if (success && id) {
      router.push(`/interview/${interviewId}/feedback`);
    } else {
      console.log("Error saving FeedBack");
      router.push("/");
    }
  };

  useEffect(() => {
    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/");
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, type, userId]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
    setError(null);

    try {
      // Use new VAPI Workflow start signature!
      setCallStatus(CallStatus.CONNECTING);
      if (type === "generate") {
        //for running using assistant id.
        // await vapi.start(
        //   process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
        //    {
        //   variableValues: {
        //     username: userName,
        //     userid: userId,
        //   },
        // });
        await vapi.start(
          undefined, // assistantId (leave undefined if using workflow)
          undefined, // squadId (if you don't use squads)
          undefined, // provider (leave undefined)
          process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID,
          {
            variableValues: {
              username: userName,
              userid: userId,
            },
          }
        );
      } else {
        let formattedQuestions = "";
        if (questions) {
            formattedQuestions = questions
            .map((question: string) => `-${question}`)
            .join("\n");
        }
        await vapi.start(interviewer,{
          variableValues:{
            questions : formattedQuestions
          }
        })
      }
    } catch (err: any) {
      setError(err?.message ?? "Could not start VAPI interview.");
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = async () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  const lastestMessage = messages[messages.length - 1]?.content;
  const isCallInactiveOrFinished =
    callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

  return (
    <>
      <div className="call-view">
        {/* AI Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="vapi"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>
        {/* User Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="user avatar"
              className="rounded-full object-cover size-[120px]"
              width={540}
              height={540}
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>
      {/* Transcript display */}
      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              className={cn(
                "transition-opacity duration-500 animate-fadeIn opacity-100"
              )}
            >
              <strong>
                {messages[messages.length - 1].role === "assistant"
                  ? "AI:"
                  : "You:"}
              </strong>
              &nbsp;{messages[messages.length - 1].content}
            </p>
          </div>
        </div>
      )}
      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 my-2">
          {error}
        </div>
      )}
      {/* Call Buttons */}
      <div className="w-full flex justify-center">
        {callStatus !== CallStatus.ACTIVE ? (
          <button
            className="relative btn-call"
            onClick={handleCall}
            disabled={callStatus === CallStatus.CONNECTING}
          >
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== CallStatus.CONNECTING && "hidden"
              )}
            />
            <span>{isCallInactiveOrFinished ? "Call" : ". . ."}</span>
          </button>
        ) : (
          <button
            className="btn-disconnect cursor-pointer"
            onClick={handleDisconnect}
          >
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
