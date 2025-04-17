# Better Anki - AI Flashcard Generator

![Better Anki Banner](public/banner.png) <!-- Optional: Add a banner image to public/banner.png -->

Learn languages with AI-generated flashcards using spaced repetition. Like Anki, but better!

This is a Next.js application bootstrapped with `create-next-app`, utilizing AI to generate language flashcards and incorporating spaced repetition learning techniques.

## 📖 How to Use

Visit the live application: [https://better-than-anki.vercel.app/](https://better-than-anki.vercel.app/)

1.  **Sign Up / Sign In: (Soon)** Create an account or sign in using your email. Email confirmation is required for new accounts.

2.  **Navigate:** The application has two main sections accessible from the top navigation:
    *   **Create:** Generate new flashcards using AI.
    *   **Learn:** Review your existing flashcards using the spaced repetition system.

3.  **Create Tab:**
    *   **Select Languages:** Choose your native and target languages.
    *   **Enter Prompt:** Provide a topic, sentence, or list of words you want to generate flashcards for.
    *   **Generate:** Click the generate button. The AI will create flashcard suggestions.
    *   **Review & Select:** Review the generated cards, deselect any you don't want.
    *   **Choose Deck:** Select an existing deck or create a new one to save the cards to.
    *   **Save:** Click save to add the selected flashcards to your chosen deck.

4.  **Learn Tab:**
    *   **Select Languages:** Choose the language pair for the deck you want to study.
    *   **Select Deck:** Choose the deck you wish to review from the dropdown menu.
    *   **View Cards:** Browse through the flashcards in the selected deck.
    *   **Start Review:** Click the "Start Review" button (if there are cards due) to begin a spaced repetition session.
    *   **Rate Recall:** During review, rate how well you remembered each card (Again, Hard, Good, Easy). The system will schedule the next review accordingly.
    *   **Manage Cards:** You can edit or delete individual cards or multiple cards within a deck.

5.  **Deck Management:** In the "Learn" tab, use the deck management options to create new decks, edit existing deck names/descriptions, or delete decks.

6.  **Settings:**
    *   **Theme:** Toggle between light and dark mode using the theme icon in the navigation bar.
    *   **API Key:** (If applicable) Enter your AI provider API key via the settings dialog (gear icon) for generation.
    *   **Spaced Repetition:** Adjust the intervals for the spaced repetition system. 