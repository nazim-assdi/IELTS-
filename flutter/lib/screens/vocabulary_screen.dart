import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/dictionary_api.dart';
import '../services/gemini_api.dart';
import '../theme/ielts_theme.dart';
import '../widgets/premium_ui.dart';

class VocabularyScreen extends StatefulWidget {
  const VocabularyScreen({super.key, required this.prefs});
  final SharedPreferences prefs;

  @override
  State<VocabularyScreen> createState() => _VocabularyScreenState();
}

class _VocabularyScreenState extends State<VocabularyScreen> {
  final searchController = TextEditingController();
  final dictionary = DictionaryApi();
  final tts = FlutterTts();
  final ai = GeminiApi(baseUrl: defaultIeltsApiUrl);

  DictionaryEntry? entry;
  String? errorMessage;
  String banglaMeaning = '';
  bool searching = false;
  bool translating = false;
  bool speaking = false;
  bool showSaved = false;
  int lookupGeneration = 0;
  List<String> favourites = [];
  List<String> recent = [];

  @override
  void initState() {
    super.initState();
    favourites = widget.prefs.getStringList('dictionary_favourites') ?? [];
    recent = widget.prefs.getStringList('dictionary_recent') ?? [];
    _configureVoice();
  }

  Future<void> _configureVoice() async {
    try {
      await tts.setLanguage('en-GB');
      await tts.setSpeechRate(0.42);
      await tts.setPitch(1.0);
      await tts.setVolume(1.0);
    } catch (_) {}
  }

  Future<void> _lookup([String? requestedWord]) async {
    final word = (requestedWord ?? searchController.text).trim().toLowerCase();
    if (word.isEmpty || searching) return;
    final requestId = ++lookupGeneration;
    searchController.text = word;
    FocusScope.of(context).unfocus();
    setState(() {
      searching = true;
      translating = false;
      errorMessage = null;
      banglaMeaning = '';
      entry = null;
    });

    try {
      final found = await dictionary.lookup(word);
      if (!mounted || requestId != lookupGeneration) return;
      final updatedRecent = [word, ...recent.where((item) => item != word)].take(12).toList();
      setState(() {
        entry = found;
        recent = updatedRecent;
        searching = false;
      });
      await widget.prefs.setStringList('dictionary_recent', updatedRecent);

      final firstDefinition = found.definitions.first.definition;
      if (firstDefinition.isNotEmpty) {
        setState(() => translating = true);
        try {
          final translated = await ai.translateText(
            text: firstDefinition,
            targetLanguage: 'Bengali',
          ).timeout(const Duration(seconds: 28));
          if (mounted && requestId == lookupGeneration) {
            setState(() => banglaMeaning = translated.trim());
          }
        } catch (_) {
          if (mounted && requestId == lookupGeneration) {
            setState(() => banglaMeaning = 'বাংলা অর্থ এই মুহূর্তে পাওয়া যাচ্ছে না। পরে আবার চেষ্টা করুন।');
          }
        } finally {
          if (mounted && requestId == lookupGeneration) setState(() => translating = false);
        }
      }
    } catch (error) {
      if (mounted && requestId == lookupGeneration) {
        setState(() => errorMessage = error.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted && requestId == lookupGeneration) setState(() => searching = false);
    }
  }

  Future<void> _toggleFavourite(String word) async {
    final updated = [...favourites];
    if (updated.contains(word)) {
      updated.remove(word);
    } else {
      updated.insert(0, word);
    }
    await widget.prefs.setStringList('dictionary_favourites', updated);
    if (mounted) setState(() => favourites = updated);
  }

  Future<void> _speak(String word) async {
    if (speaking) return;
    setState(() => speaking = true);
    try {
      await tts.stop();
      await tts.speak(word);
    } catch (error) {
      if (mounted) _notice('Pronunciation could not play: $error');
    } finally {
      if (mounted) setState(() => speaking = false);
    }
  }

  void _copy(String text) {
    Clipboard.setData(ClipboardData(text: text));
    _notice('Copied to clipboard.');
  }

  void _notice(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  void dispose() {
    searchController.dispose();
    dictionary.dispose();
    tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 30),
      children: [
        PremiumPageIntro(
          eyebrow: 'English learning tools',
          title: 'Dictionary',
          subtitle: 'Look up real English definitions, pronunciation, examples and Bangla meanings.',
          trailing: const PremiumChip('EN · BN', icon: Icons.language_rounded),
        ),
        Container(
          padding: const EdgeInsets.all(17),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF17364A), Color(0xFF1B5D57)],
            ),
            borderRadius: BorderRadius.circular(22),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('WORD DISCOVERY', style: TextStyle(color: Color(0xFFB7DDD2), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1.3)),
            const SizedBox(height: 7),
            const Text('Find the meaning.\nLearn how to use it.', style: TextStyle(color: Colors.white, fontSize: 22, height: 1.1, fontWeight: FontWeight.w900, letterSpacing: -.6)),
            const SizedBox(height: 8),
            const Text('Search one English word to see definitions and real usage examples.', style: TextStyle(color: Colors.white70, fontSize: 11, height: 1.4)),
          ]),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(13),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: IeltsPalette.line)),
          child: Column(children: [
            TextField(
              controller: searchController,
              maxLength: 50,
              textInputAction: TextInputAction.search,
              autocorrect: false,
              onSubmitted: (_) => _lookup(),
              decoration: InputDecoration(
                counterText: '',
                hintText: 'Search an English word…',
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: IconButton(
                  tooltip: 'Clear search',
                  onPressed: searching ? null : () {
                    searchController.clear();
                    setState(() { entry = null; errorMessage = null; banglaMeaning = ''; });
                  },
                  icon: const Icon(Icons.close_rounded),
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: searching ? null : () => _lookup(),
                icon: searching
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.menu_book_rounded),
                label: Text(searching ? 'Searching dictionary…' : 'Search dictionary'),
              ),
            ),
          ]),
        ),
        const SizedBox(height: 14),
        Row(children: [
          Expanded(child: _modeButton('Dictionary', !showSaved, () => setState(() => showSaved = false), Icons.search_rounded)),
          const SizedBox(width: 9),
          Expanded(child: _modeButton('Saved words (${favourites.length})', showSaved, () => setState(() => showSaved = true), Icons.bookmark_rounded)),
        ]),
        if (showSaved) ..._savedWords(),
        if (!showSaved && entry == null && errorMessage == null) ..._discoveryContent(),
        if (!showSaved && searching) ...[
          const SizedBox(height: 23),
          const Center(child: CircularProgressIndicator()),
          const SizedBox(height: 9),
          const Center(child: Text('Finding dictionary entries…', style: TextStyle(color: IeltsPalette.muted, fontSize: 11))),
        ],
        if (!showSaved && errorMessage != null) ...[
          const SizedBox(height: 15),
          _errorCard(errorMessage!),
        ],
        if (!showSaved && entry != null) ..._entryContent(entry!),
      ],
    );
  }

  Widget _modeButton(String label, bool active, VoidCallback onTap, IconData icon) => Material(
    color: active ? IeltsPalette.mint : Colors.white,
    borderRadius: BorderRadius.circular(14),
    child: InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), border: Border.all(color: active ? IeltsPalette.emerald.withValues(alpha: .25) : IeltsPalette.line)),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(icon, size: 15, color: active ? IeltsPalette.emerald : IeltsPalette.muted),
          const SizedBox(width: 6),
          Flexible(child: Text(label, overflow: TextOverflow.ellipsis, style: TextStyle(color: active ? IeltsPalette.emeraldDeep : IeltsPalette.inkSoft, fontWeight: FontWeight.w900, fontSize: 10))),
        ]),
      ),
    ),
  );

  List<Widget> _discoveryContent() => [
    const SizedBox(height: 21),
    const PremiumSectionHeading('Explore useful IELTS words'),
    Wrap(
      spacing: 8,
      runSpacing: 8,
      children: ['resilient', 'meticulous', 'ubiquitous', 'eloquent', 'sustainable', 'profound'].map((word) => ActionChip(
        label: Text(word),
        avatar: const Icon(Icons.search_rounded, size: 14),
        onPressed: searching ? null : () => _lookup(word),
        backgroundColor: Colors.white,
        side: const BorderSide(color: IeltsPalette.line),
        labelStyle: const TextStyle(color: IeltsPalette.inkSoft, fontWeight: FontWeight.w700, fontSize: 11),
      )).toList(),
    ),
    if (recent.isNotEmpty) ...[
      const SizedBox(height: 22),
      const PremiumSectionHeading('Recent searches'),
      ...recent.take(6).map((word) => ListTile(
        contentPadding: EdgeInsets.zero,
        leading: const Icon(Icons.history_rounded, color: IeltsPalette.muted),
        title: Text(word, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
        trailing: const Icon(Icons.north_west_rounded, size: 15, color: IeltsPalette.muted),
        onTap: () => _lookup(word),
      )),
    ],
  ];

  List<Widget> _savedWords() {
    if (favourites.isEmpty) {
      return [
        const SizedBox(height: 25),
        const Center(child: Icon(Icons.bookmark_border_rounded, size: 45, color: IeltsPalette.muted)),
        const SizedBox(height: 9),
        const Center(child: Text('No saved words yet', style: TextStyle(fontWeight: FontWeight.w900, color: IeltsPalette.ink))),
        const SizedBox(height: 5),
        const Center(child: Text('Save a word from its dictionary entry to review it here.', textAlign: TextAlign.center, style: TextStyle(color: IeltsPalette.muted, fontSize: 11))),
      ];
    }
    return [
      const SizedBox(height: 14),
      const PremiumSectionHeading('Your saved vocabulary'),
      ...favourites.map((word) => Container(
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(15), border: Border.all(color: IeltsPalette.line)),
        child: ListTile(
          leading: const Icon(Icons.bookmark_rounded, color: IeltsPalette.emerald),
          title: Text(word, style: const TextStyle(fontWeight: FontWeight.w900, color: IeltsPalette.ink)),
          trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 13, color: IeltsPalette.muted),
          onTap: () {
            setState(() => showSaved = false);
            _lookup(word);
          },
        ),
      )),
    ];
  }

  List<Widget> _entryContent(DictionaryEntry value) {
    final isSaved = favourites.contains(value.word.toLowerCase());
    return [
      const SizedBox(height: 17),
      Container(
        padding: const EdgeInsets.all(17),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(21), border: Border.all(color: IeltsPalette.emerald.withValues(alpha: .25))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const PremiumChip('DICTIONARY ENTRY', icon: Icons.menu_book_rounded),
            const Spacer(),
            IconButton(
              tooltip: isSaved ? 'Remove from saved words' : 'Save word',
              onPressed: () => _toggleFavourite(value.word.toLowerCase()),
              icon: Icon(isSaved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded, color: IeltsPalette.emerald),
            ),
          ]),
          const SizedBox(height: 8),
          Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
            Expanded(child: Text(value.word, style: const TextStyle(color: IeltsPalette.ink, fontSize: 27, fontWeight: FontWeight.w900, letterSpacing: -.8))),
            IconButton.filledTonal(
              tooltip: 'Hear pronunciation',
              onPressed: speaking ? null : () => _speak(value.word),
              icon: Icon(speaking ? Icons.volume_up_rounded : Icons.volume_up_outlined),
            ),
          ]),
          if (value.phonetic.isNotEmpty) ...[
            const SizedBox(height: 3),
            Text(value.phonetic, style: const TextStyle(color: IeltsPalette.emerald, fontSize: 15, fontWeight: FontWeight.w700)),
          ],
          const SizedBox(height: 13),
          if (translating) const LinearProgressIndicator(minHeight: 2),
          if (banglaMeaning.isNotEmpty) ...[
            const Text('বাংলা অর্থ', style: TextStyle(color: IeltsPalette.gold, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
            const SizedBox(height: 6),
            Text(banglaMeaning, style: const TextStyle(color: IeltsPalette.ink, fontSize: 15, fontWeight: FontWeight.w700, height: 1.5)),
            const Divider(height: 24),
          ],
          if (value.origin.isNotEmpty) ...[
            const Text('WORD ORIGIN', style: TextStyle(color: IeltsPalette.muted, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
            const SizedBox(height: 4),
            Text(value.origin, style: const TextStyle(color: IeltsPalette.inkSoft, fontSize: 11, height: 1.45)),
            const Divider(height: 24),
          ],
          Row(children: [
            const Text('DEFINITIONS', style: TextStyle(color: IeltsPalette.emerald, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1.1)),
            const Spacer(),
            Text('${value.definitions.length} meanings', style: const TextStyle(color: IeltsPalette.muted, fontSize: 10)),
          ]),
        ]),
      ),
      ...value.definitions.take(8).toList().asMap().entries.map((item) => _definitionCard(item.key + 1, item.value)),
      const SizedBox(height: 12),
      OutlinedButton.icon(
        onPressed: () => _copy([
          value.word,
          if (value.phonetic.isNotEmpty) value.phonetic,
          ...value.definitions.map((definition) => '${definition.partOfSpeech}: ${definition.definition}'),
        ].join('\n')),
        icon: const Icon(Icons.copy_rounded, size: 17),
        label: const Text('Copy dictionary entry'),
      ),
      const SizedBox(height: 7),
      const Text('Definitions are retrieved from the Free Dictionary API. Bangla meaning is generated separately and may need context review.', style: TextStyle(color: IeltsPalette.muted, fontSize: 9, height: 1.4)),
    ];
  }

  Widget _definitionCard(int number, DictionaryDefinition definition) => Container(
    margin: const EdgeInsets.only(top: 9),
    padding: const EdgeInsets.all(15),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: IeltsPalette.line)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        PremiumChip(definition.partOfSpeech.toUpperCase(), color: const Color(0xFF6E70A8)),
        const Spacer(),
        Text('#$number', style: const TextStyle(color: IeltsPalette.muted, fontSize: 10, fontWeight: FontWeight.w800)),
      ]),
      const SizedBox(height: 10),
      Text(definition.definition, style: const TextStyle(color: IeltsPalette.ink, fontSize: 13, height: 1.5, fontWeight: FontWeight.w600)),
      if (definition.example.isNotEmpty) ...[
        const SizedBox(height: 11),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(11),
          decoration: BoxDecoration(color: const Color(0xFFF5F8F7), borderRadius: BorderRadius.circular(12)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('EXAMPLE', style: TextStyle(color: IeltsPalette.emerald, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1)),
            const SizedBox(height: 4),
            Text(definition.example, style: const TextStyle(color: IeltsPalette.inkSoft, fontSize: 11, height: 1.4, fontStyle: FontStyle.italic)),
          ]),
        ),
      ],
      if (definition.synonyms.isNotEmpty) ...[
        const SizedBox(height: 11),
        const Text('SYNONYMS', style: TextStyle(color: IeltsPalette.muted, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1)),
        const SizedBox(height: 6),
        _wordChips(definition.synonyms),
      ],
      if (definition.antonyms.isNotEmpty) ...[
        const SizedBox(height: 10),
        const Text('ANTONYMS', style: TextStyle(color: IeltsPalette.muted, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1)),
        const SizedBox(height: 6),
        _wordChips(definition.antonyms),
      ],
    ]),
  );

  Widget _wordChips(List<String> words) => Wrap(
    spacing: 6,
    runSpacing: 6,
    children: words.take(8).map((word) => ActionChip(
      label: Text(word),
      onPressed: () => _lookup(word),
      backgroundColor: IeltsPalette.mint,
      side: BorderSide.none,
      visualDensity: VisualDensity.compact,
      labelStyle: const TextStyle(color: IeltsPalette.emeraldDeep, fontSize: 10, fontWeight: FontWeight.w700),
    )).toList(),
  );

  Widget _errorCard(String message) => Container(
    padding: const EdgeInsets.all(15),
    decoration: BoxDecoration(color: const Color(0xFFFFF1ED), borderRadius: BorderRadius.circular(17), border: Border.all(color: const Color(0xFFF2D6CD))),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Icon(Icons.error_outline_rounded, color: Color(0xFFB95B43)),
      const SizedBox(width: 10),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Dictionary search failed', style: TextStyle(color: Color(0xFF8C3E2B), fontWeight: FontWeight.w900, fontSize: 12)),
        const SizedBox(height: 4),
        Text(message, style: const TextStyle(color: Color(0xFF8C3E2B), fontSize: 11, height: 1.4)),
        TextButton.icon(onPressed: searching ? null : () => _lookup(), icon: const Icon(Icons.refresh_rounded, size: 16), label: const Text('Try again')),
      ])),
    ]),
  );
}
