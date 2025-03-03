import React from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useState } from "react";
import axios from "axios";
import { downloadModel } from "./src/api/model";
import ProgressBar from "./src/components/ProgressBar";

function App(): React.JSX.Element {
  type Message = {
    role: "system" | "user" | "assistant";
    content: string;
  };

  const INITIAL_CONVERSATION: Message[] = [
    {
      role: "system",
      content:
        "This is a conversation between user and assistant, a friendly chatbot.",
    },
  ];

  const modelFormats = [
    { label: "Llama-3.2-1B-Instruct" },
    { label: "Qwen2-0.5B-Instruct" },
    { label: "DeepSeek-R1-Distill-Qwen-1.5B" },
    { label: "SmolLM2-1.7B-Instruct" },
  ];

  const HF_TO_GGUF = {
    "Llama-3.2-1B-Instruct": "medmekk/Llama-3.2-1B-Instruct.GGUF",
    "DeepSeek-R1-Distill-Qwen-1.5B":
      "medmekk/DeepSeek-R1-Distill-Qwen-1.5B.GGUF",
    "Qwen2-0.5B-Instruct": "medmekk/Qwen2.5-0.5B-Instruct.GGUF",
    "SmolLM2-1.7B-Instruct": "medmekk/SmolLM2-1.7B-Instruct.GGUF",
  };

  const [conversation, setConversation] =
    useState<Message[]>(INITIAL_CONVERSATION);
  const [selectedModelFormat, setSelectedModelFormat] = useState<string>("");
  const [selectedGGUF, setSelectedGGUF] = useState<string | null>(null);
  const [availableGGUFs, setAvailableGGUFs] = useState<string[]>([]);
  const [userInput, setUserInput] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [context, setContext] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const fetchAvailableGGUFs = async (modelFormat: string) => {
    if (!modelFormat) {
      Alert.alert("Error", "Please select a model format first.");
      return;
    }

    try {
      const repoPath = HF_TO_GGUF[modelFormat as keyof typeof HF_TO_GGUF];
      if (!repoPath) {
        throw new Error(
          `No repository mapping found for model format: ${modelFormat}`
        );
      }

      const response = await axios.get(
        `https://huggingface.co/api/models/${repoPath}`
      );

      if (!response.data?.siblings) {
        throw new Error("Invalid API response format");
      }

      const files = response.data.siblings.filter(
        (file: { rfilename: string }) => file.rfilename.endsWith(".gguf")
      );

      setAvailableGGUFs(
        files.map((file: { rfilename: string }) => file.rfilename)
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch .gguf files";
      Alert.alert("Error", errorMessage);
      setAvailableGGUFs([]);
    }
  };
  const handleDownloadModel = async (file: string) => {
    const downloadUrl = `https://huggingface.co/${
      HF_TO_GGUF[selectedModelFormat as keyof typeof HF_TO_GGUF]
    }/resolve/main/${file}`;
    // we set the isDownloading state to true to show the progress bar and set the progress to 0
    setIsDownloading(true);
    setProgress(0);

    try {
      // we download the model using the downloadModel function, it takes the selected GGUF file, the download URL, and a progress callback function to update the progress bar
      const destPath = await downloadModel(file, downloadUrl, (progress) =>
        setProgress(progress)
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Download failed due to an unknown error.";
      Alert.alert("Error", errorMessage);
      setIsDownloading(false);
    } finally {
      setIsDownloading(false);
    }
  };
  return (
    <SafeAreaView>
      <Text>Hello World</Text>
      <TouchableOpacity
        onPress={() => fetchAvailableGGUFs("Llama-3.2-1B-Instruct")}
      >
        <Text>Fetch GGUF Files</Text>
      </TouchableOpacity>
      <ScrollView>
        {availableGGUFs.map((file) => (
          <Text key={file}>{file}</Text>
        ))}
      </ScrollView>

      <View style={{ marginTop: 30, marginBottom: 15 }}>
        {Object.keys(HF_TO_GGUF).map((format) => (
          <TouchableOpacity
            key={format}
            onPress={() => {
              setSelectedModelFormat(format);
            }}
          >
            <Text>
              {format}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={{ marginBottom: 10, color: selectedModelFormat ? 'black' : 'gray' }}>
        {selectedModelFormat 
          ? `Selected: ${selectedModelFormat}` 
          : 'Please select a model format before downloading'}
      </Text>
      <TouchableOpacity
        onPress={() => {          // Then download the model
          handleDownloadModel("Llama-3.2-1B-Instruct-Q2_K.gguf");
        }}
      >
        <Text>Download Model</Text>
      </TouchableOpacity>
      {isDownloading && <ProgressBar progress={progress} />}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({});

export default App;
