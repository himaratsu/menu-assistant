import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  Box,
  Button,
  Flex,
  Grid,
  Group,
  Space,
  TextInput,
  Textarea,
} from "@mantine/core";

export default function Home() {
  const [conditionLoading, setConditionLoading] = useState(false);
  const [conditionText, setConditionText] = useState("");
  const [responseText, setResponseText] = useState("");

  const requestCondition = async () => {
    setConditionText("");
    setResponseText("");

    setConditionLoading(true);
    const response = await fetch("/api/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: input,
      }),
    });

    setConditionLoading(false);

    const result = await response.json();
    setConditionText(result.content);

    console.log(result.content);

    const parameter = JSON.parse(result.content);

    request(
      parameter.price_less_than,
      parameter.price_greater_than,
      parameter.genre
    );
  };

  const request = async (
    priceLessThan: number,
    priceGreaterThan: number,
    genre: string
  ) => {
    console.log(priceLessThan);
    console.log(priceGreaterThan);
    console.log(genre);

    const response = await fetch("/api/answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        priceLessThan,
        priceGreaterThan,
        genre,
        input,
      }),
    });

    console.log(response);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    let lastMessage = "";

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);

      lastMessage = lastMessage + chunkValue;

      setResponseText(lastMessage);
    }
  };

  const tasks = [
    "おすすめの和食メニューはありますか？",
    "1500円以内で食べられるものを教えて",
    "2000円以内で洋食を食べたいです",
  ];
  const randomIndex = Math.floor(Math.random() * tasks.length);

  const [input, setInput] = useState(tasks[randomIndex]);

  return (
    <main>
      <div className="container mx-auto mt-32">
        <Group position="center">
          <h3 className="font-semibold text-gray-600">ルームサービスAI</h3>
        </Group>
        <Group position="center" align="flex-end" className="mt-8">
          <TextInput
            className="w-72"
            value={input}
            onChange={(event) => setInput(event.currentTarget.value)}
          />

          <Button onClick={requestCondition}>質問する</Button>
        </Group>

        <Box className="mt-24 w-2/3 mx-auto text-gray-600 leading-relaxed border border-gray-300 border-dashed rounded min-h-72 p-8">
          <h5 className="text-sm font-bold mb-4">条件の抽出（デバッグ表示）</h5>
          {conditionText ? (
            conditionText
          ) : (
            <div className=" text-gray-500 text-sm mb-2">
              {conditionLoading && "Loading..."}
            </div>
          )}
        </Box>

        <Box className="mt-16 w-2/3 mx-auto text-gray-600 leading-relaxed bg-gray-100 rounded min-h-72 p-8">
          <h5 className="text-sm font-bold mb-4">AIの回答</h5>
          {responseText ? (
            responseText
          ) : (
            <div className=" text-gray-500 text-sm mb-4"></div>
          )}
        </Box>
      </div>
    </main>
  );
}
