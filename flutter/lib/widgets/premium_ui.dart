import 'package:flutter/material.dart';
import '../theme/ielts_theme.dart';

class PremiumPageIntro extends StatelessWidget {
  const PremiumPageIntro({
    super.key,
    required this.eyebrow,
    required this.title,
    required this.subtitle,
    this.trailing,
  });

  final String eyebrow;
  final String title;
  final String subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 18),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(eyebrow.toUpperCase(), style: const TextStyle(
          color: IeltsPalette.emerald,
          fontSize: 10,
          fontWeight: FontWeight.w900,
          letterSpacing: 1.35,
        )),
        const SizedBox(height: 6),
        Text(title, style: Theme.of(context).textTheme.headlineSmall?.copyWith(
          fontWeight: FontWeight.w900,
          letterSpacing: -.65,
          height: 1.08,
        )),
        const SizedBox(height: 7),
        Text(subtitle, style: Theme.of(context).textTheme.bodyMedium?.copyWith(
          color: IeltsPalette.muted,
          height: 1.4,
        )),
      ])),
      if (trailing != null) ...[
        const SizedBox(width: 10),
        trailing!,
      ],
    ]),
  );
}

class PremiumSectionHeading extends StatelessWidget {
  const PremiumSectionHeading(this.title, {super.key, this.action, this.onTap});
  final String title;
  final String? action;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12, top: 5),
    child: Row(children: [
      Expanded(child: Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(
        color: IeltsPalette.ink,
        fontWeight: FontWeight.w900,
        letterSpacing: -.25,
      ))),
      if (action != null)
        TextButton(onPressed: onTap, child: Text(action!)),
    ]),
  );
}

class PremiumMetricCard extends StatelessWidget {
  const PremiumMetricCard({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
    this.detail,
    this.tint = IeltsPalette.mint,
    this.iconColor = IeltsPalette.emerald,
  });
  final IconData icon;
  final String label;
  final String value;
  final String? detail;
  final Color tint;
  final Color iconColor;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(15),
    decoration: BoxDecoration(
      color: Theme.of(context).cardColor,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: IeltsPalette.line),
      boxShadow: [BoxShadow(color: IeltsPalette.ink.withValues(alpha: .035), blurRadius: 14, offset: const Offset(0, 5))],
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        height: 34, width: 34,
        decoration: BoxDecoration(color: tint, borderRadius: BorderRadius.circular(12)),
        child: Icon(icon, color: iconColor, size: 18),
      ),
      const SizedBox(height: 12),
      Text(value, maxLines: 1, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.titleLarge?.copyWith(
        color: IeltsPalette.ink,
        fontWeight: FontWeight.w900,
        letterSpacing: -.5,
      )),
      const SizedBox(height: 3),
      Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: IeltsPalette.muted, fontSize: 11, fontWeight: FontWeight.w700)),
      if (detail != null) ...[
        const SizedBox(height: 5),
        Text(detail!, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: IeltsPalette.emerald, fontSize: 10, fontWeight: FontWeight.w800)),
      ],
    ]),
  );
}

class PremiumFeatureTile extends StatelessWidget {
  const PremiumFeatureTile({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.accent = IeltsPalette.emerald,
  });
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final Color accent;

  @override
  Widget build(BuildContext context) => Material(
    color: Theme.of(context).cardColor,
    borderRadius: BorderRadius.circular(20),
    child: InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: IeltsPalette.line),
        ),
        child: Row(children: [
          Container(
            height: 44, width: 44,
            decoration: BoxDecoration(
              color: accent.withValues(alpha: .11),
              borderRadius: BorderRadius.circular(15),
            ),
            child: Icon(icon, color: accent, size: 22),
          ),
          const SizedBox(width: 13),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: IeltsPalette.ink)),
            const SizedBox(height: 3),
            Text(subtitle, style: const TextStyle(fontSize: 11, color: IeltsPalette.muted, height: 1.3)),
          ])),
          const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: IeltsPalette.muted),
        ]),
      ),
    ),
  );
}

class PremiumChip extends StatelessWidget {
  const PremiumChip(this.label, {super.key, this.icon, this.color = IeltsPalette.emerald});
  final String label;
  final IconData? icon;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
    decoration: BoxDecoration(color: color.withValues(alpha: .10), borderRadius: BorderRadius.circular(50)),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      if (icon != null) ...[Icon(icon, size: 13, color: color), const SizedBox(width: 5)],
      Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: .2)),
    ]),
  );
}
