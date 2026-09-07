import Foundation

class TranslationService {
    static let shared = TranslationService()

    private init() {}

    /// Translate text from any source language (e.g. Spanish) to natural English (100% Free, zero API keys)
    func translateToEnglish(text: String, sourceLanguage: String = "auto") async -> String {
        let trimmedText = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedText.isEmpty else { return "" }

        guard let encoded = trimmedText.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: "https://translate.googleapis.com/translate_a/single?client=gtx&sl=\(sourceLanguage)&tl=en&dt=t&q=\(encoded)") else {
            return trimmedText
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 5.0
        request.setValue("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", forHTTPHeaderField: "User-Agent")

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                return trimmedText
            }

            if let json = try JSONSerialization.jsonObject(with: data) as? [Any],
               let sentences = json.first as? [[Any]] {
                let translated = sentences.compactMap { $0.first as? String }.joined()
                let cleanResult = translated.trimmingCharacters(in: .whitespacesAndNewlines)
                return cleanResult.isEmpty ? trimmedText : cleanResult
            }
        } catch {
            print("TranslationService fallback: \(error.localizedDescription)")
        }

        return trimmedText
    }
}
