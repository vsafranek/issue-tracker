import React, { useState } from "react";
import { Box, Button, Input, Text, VStack, HStack } from "@chakra-ui/react";

function App() {
  const [subtitleIndex, setSubtitleIndex] = useState<string>("");
  const [lastSubtitleIndex, setLastSubtitleIndex] = useState<string>("");
  const [timeShift, setTimeShift] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");
  const [modifiedContent, setModifiedContent] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setFile(files[0]);
    }
  };

  const handleSubmit = () => {
    if (!file) {
      setMessage("Please select an SRT file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lastIndex = lastSubtitleIndex
        ? parseInt(lastSubtitleIndex)
        : getLastSubtitleIndex(content);
      const modified = modifySubtitleTiming(
        content,
        parseInt(subtitleIndex),
        lastIndex,
        parseFloat(timeShift)
      );
      setModifiedContent(modified);
      setMessage(
        `Subtitles from index ${subtitleIndex} to ${lastIndex} have been shifted by ${timeShift} seconds.`
      );
    };
    reader.readAsText(file);
  };

  const modifySubtitleTiming = (
    content: string,
    startIndex: number,
    lastIndex: number,
    timeShiftSeconds: number
  ): string => {
    const lines = content.split("\n");
    const timeShift = timeShiftSeconds * 1000; // Convert to milliseconds
    let subtitleCount = 0;

    return lines
      .map((line) => {
        if (/^\d+$/.test(line.trim())) {
          // If line is an index
          subtitleCount += 1;
        }

        if (
          subtitleCount >= startIndex &&
          subtitleCount <= lastIndex &&
          line.includes("-->")
        ) {
          return shiftSubtitleTiming(line, timeShift);
        }
        return line;
      })
      .join("\n");
  };

  const shiftSubtitleTiming = (line: string, timeShift: number): string => {
    const [startTime, endTime] = line.split(" --> ");
    return `${shiftTime(startTime, timeShift)} --> ${shiftTime(
      endTime,
      timeShift
    )}`;
  };

  const shiftTime = (time: string, shift: number): string => {
    const [hours, minutes, secondsMillis] = time.split(":");
    const [seconds, millis] = secondsMillis.split(",");
    const totalMillis =
      (parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds)) *
        1000 +
      parseInt(millis) +
      shift;

    const newHours = Math.floor(totalMillis / 3600000)
      .toString()
      .padStart(2, "0");
    const newMinutes = Math.floor((totalMillis % 3600000) / 60000)
      .toString()
      .padStart(2, "0");
    const newSeconds = Math.floor((totalMillis % 60000) / 1000)
      .toString()
      .padStart(2, "0");
    const newMillis = (totalMillis % 1000).toString().padStart(3, "0");

    return `${newHours}:${newMinutes}:${newSeconds},${newMillis}`;
  };

  const getLastSubtitleIndex = (content: string): number => {
    const lines = content.split("\n");
    let lastIndex = 0;

    lines.forEach((line) => {
      if (/^\d+$/.test(line.trim())) {
        // If line is an index
        lastIndex = parseInt(line.trim());
      }
    });

    return lastIndex;
  };

  const downloadModifiedFile = () => {
    if (!modifiedContent || !file) return;

    const blob = new Blob([modifiedContent], {
      type: "text/srt;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `modified_${file.name}`;
    link.click();
  };

  return (
    <Box
      height="100vh"
      width="100vw"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.50"
    >
      <Box
        p={8}
        maxW="600px"
        width="100%"
        bg="white"
        boxShadow="lg"
        borderRadius="md"
      >
        <VStack spacing={6} align="stretch">
          <Text fontSize="3xl" fontWeight="bold" textAlign="center">
            Subtitle Timing Editor
          </Text>

          <HStack spacing={4}>
            <Input
              placeholder="Start Index"
              value={subtitleIndex}
              onChange={(e) => setSubtitleIndex(e.target.value)}
              type="number"
              size="lg"
            />
            <Input
              placeholder="Last Index (optional)"
              value={lastSubtitleIndex}
              onChange={(e) => setLastSubtitleIndex(e.target.value)}
              type="number"
              size="lg"
            />
          </HStack>

          <Input
            placeholder="Time Shift (seconds)"
            value={timeShift}
            onChange={(e) => setTimeShift(e.target.value)}
            type="number"
            size="lg"
            py={3}
          />

          <Input
            type="file"
            accept=".srt"
            onChange={handleFileChange}
            size="lg"
            py={3}
          />

          <Button colorScheme="teal" size="lg" onClick={handleSubmit}>
            Modify Subtitle Timing
          </Button>

          {modifiedContent && (
            <Button colorScheme="blue" size="lg" onClick={downloadModifiedFile}>
              Download Modified File
            </Button>
          )}

          {message && (
            <Text color="green.500" fontSize="lg" textAlign="center">
              {message}
            </Text>
          )}
        </VStack>
      </Box>
    </Box>
  );
}

export default App;
