// App Shadows - Colored Shadow System
// lib/core/theme/app_shadows.dart
//
// Following UI.md Rule #1:
// "Nunca uses una sombra negra pura (#000) con alta opacidad"
// "Usa sombras con un matiz del color del elemento o del fondo"

import 'package:flutter/material.dart';
import 'package:strop_app/core/theme/app_colors.dart';

/// STROP shadow system with colored shadows per UI.md
abstract class AppShadows {
  // ===========================================
  // ELEVATION SHADOWS (Colored, not black)
  // ===========================================

  /// Small elevation shadow - subtle depth
  static List<BoxShadow> get small => [
    BoxShadow(
      color: AppColors.primary.withValues(alpha: 0.08),
      blurRadius: 8,
      offset: const Offset(0, 2),
    ),
  ];

  /// Medium elevation shadow - cards
  static List<BoxShadow> get medium => [
    BoxShadow(
      color: AppColors.primary.withValues(alpha: 0.1),
      blurRadius: 16,
      offset: const Offset(0, 4),
    ),
  ];

  /// Large elevation shadow - modals, FAB
  static List<BoxShadow> get large => [
    BoxShadow(
      color: AppColors.primary.withValues(alpha: 0.12),
      blurRadius: 24,
      offset: const Offset(0, 8),
    ),
  ];

  /// Extra large shadow - bottom sheets, dialogs
  static List<BoxShadow> get extraLarge => [
    BoxShadow(
      color: AppColors.primary.withValues(alpha: 0.15),
      blurRadius: 32,
      offset: const Offset(0, 12),
    ),
  ];

  // ===========================================
  // ACCENT SHADOWS (For CTAs and FAB)
  // ===========================================

  /// Accent button shadow - orange tint
  static List<BoxShadow> get accentSmall => [
    BoxShadow(
      color: AppColors.accent.withValues(alpha: 0.3),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];

  /// FAB shadow with accent color
  static List<BoxShadow> get fab => [
    BoxShadow(
      color: AppColors.accent.withValues(alpha: 0.4),
      blurRadius: 16,
      offset: const Offset(0, 6),
    ),
  ];

  // ===========================================
  // STATUS SHADOWS (Color-coded)
  // ===========================================

  /// Critical/Error shadow - red tint
  static List<BoxShadow> get critical => [
    BoxShadow(
      color: AppColors.priorityCritical.withValues(alpha: 0.2),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];

  /// Success shadow - green tint
  static List<BoxShadow> get success => [
    BoxShadow(
      color: AppColors.success.withValues(alpha: 0.2),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];

  // ===========================================
  // CARD SHADOWS BY TYPE
  // ===========================================

  /// Default card shadow
  static List<BoxShadow> get card => medium;

  /// Elevated card (selected, active)
  static List<BoxShadow> get cardElevated => large;

  /// Bottom sheet shadow
  static List<BoxShadow> get bottomSheet => extraLarge;

  /// Input focus shadow
  static List<BoxShadow> inputFocus(Color color) => [
    BoxShadow(
      color: color.withValues(alpha: 0.2),
      blurRadius: 8,
    ),
  ];
}
