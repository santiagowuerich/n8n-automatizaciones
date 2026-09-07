import Foundation

enum GroqServiceError: LocalizedError {
    case missingApiKey
    case invalidResponse(statusCode: Int, message: String)
    case networkError(String)
    case emptyResponse

    var errorDescription: String? {
        switch self {
        case .missingApiKey:
            return "Groq API Key is missing. Add it in Settings."
        case .invalidResponse(let statusCode, let message):
            return "Groq API returned status \(statusCode): \(message)"
        case .networkError(let message):
            return "Network request to Groq failed: \(message)"
        case .emptyResponse:
            return "Groq returned an empty response."
        }
    }
}

class GroqService {
    static let shared = GroqService()

    private let audioEndpoint = URL(string: "https://api.groq.com/openai/v1/audio/transcriptions")!
    private let chatEndpoint = URL(string: "https://api.groq.com/openai/v1/chat/completions")!

    private init() {}

    /// Transcribe audio using Groq Whisper Large V3 Turbo (Fast & Free)
    func transcribeAudio(audioFileURL: URL, apiKey: String) async throws -> String {
        let trimmedKey = apiKey.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedKey.isEmpty else {
            throw GroqServiceError.missingApiKey
        }

        guard let audioData = try? Data(contentsOf: audioFileURL) else {
            throw GroqServiceError.networkError("Could not read audio file.")
        }

        var request = URLRequest(url: audioEndpoint)
        request.httpMethod = "POST"
        request.setValue("Bearer \(trimmedKey)", forHTTPHeaderField: "Authorization")

        let boundary = "Boundary-\(UUID().uuidString)"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        let ext = audioFileURL.pathExtension.lowercased()
        let isM4A = ext == "m4a"
        let filename = isM4A ? "audio.m4a" : "audio.wav"
        let contentType = isM4A ? "audio/m4a" : "audio/wav"

        // 1. File
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(contentType)\r\n\r\n".data(using: .utf8)!)
        body.append(audioData)
        body.append("\r\n".data(using: .utf8)!)

        // 2. Model: whisper-large-v3-turbo
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"model\"\r\n\r\n".data(using: .utf8)!)
        body.append("whisper-large-v3-turbo\r\n".data(using: .utf8)!)

        // 3. Response format
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"response_format\"\r\n\r\n".data(using: .utf8)!)
        body.append("json\r\n".data(using: .utf8)!)

        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw GroqServiceError.networkError("Invalid HTTP response")
        }

        if httpResponse.statusCode != 200 {
            let errorMsg = String(data: data, encoding: .utf8) ?? "HTTP \(httpResponse.statusCode)"
            throw GroqServiceError.invalidResponse(statusCode: httpResponse.statusCode, message: errorMsg)
        }

        struct WhisperResponse: Codable {
            let text: String
        }

        let decoded = try JSONDecoder().decode(WhisperResponse.self, from: data)
        return decoded.text.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    /// Rewrite and translate spoken Spanish text into a clean, professional English AI prompt using Groq GPT-OSS
    func refineToEnglishPrompt(spokenText: String, apiKey: String) async throws -> String {
        let trimmedKey = apiKey.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedKey.isEmpty else {
            throw GroqServiceError.missingApiKey
        }

        let systemPrompt = """
        You are an expert prompt engineer and senior software architect.
        The user dictated their thoughts in Spanish.
        Your job:
        1. Translate the user's intent to natural, professional English.
        2. Remove conversational filler words (e.g., 'ehh', 'o sea', 'tipo', 'bueno', 'haceme').
        3. Format it directly as a crisp, actionable, high-quality prompt for an AI assistant (like Claude, Cursor, or ChatGPT).
        4. Output ONLY the resulting English prompt. Do NOT include markdown code blocks, quotes, explanations, or thinking.
        """

        let payload: [String: Any] = [
            "model": "openai/gpt-oss-20b",
            "temperature": 0.2,
            "max_tokens": 1024,
            "messages": [
                ["role": "system", "content": systemPrompt],
                ["role": "user", "content": spokenText]
            ]
        ]

        var request = URLRequest(url: chatEndpoint)
        request.httpMethod = "POST"
        request.setValue("Bearer \(trimmedKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw GroqServiceError.networkError("Invalid HTTP response")
        }

        if httpResponse.statusCode != 200 {
            let errorMsg = String(data: data, encoding: .utf8) ?? "HTTP \(httpResponse.statusCode)"
            throw GroqServiceError.invalidResponse(statusCode: httpResponse.statusCode, message: errorMsg)
        }

        struct ChatResponse: Codable {
            struct Choice: Codable {
                struct Message: Codable {
                    let content: String
                }
                let message: Message
            }
            let choices: [Choice]
        }

        let decoded = try JSONDecoder().decode(ChatResponse.self, from: data)
        guard let firstChoice = decoded.choices.first else {
            throw GroqServiceError.emptyResponse
        }

        var content = firstChoice.message.content.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // Remove think tags if present
        if let regex = try? NSRegularExpression(pattern: "<think>[\\s\\S]*?</think>", options: .caseInsensitive) {
            let range = NSRange(location: 0, length: content.utf16.count)
            content = regex.stringByReplacingMatches(in: content, options: [], range: range, withTemplate: "")
        }

        return content.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
