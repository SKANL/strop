// App Colors - Semantic Color System
// lib/core/theme/app_colors.dart
//
// Following UI.md rules:
// - No pure black (#000000) - use #121212 for dark backgrounds
// - Colored shadows instead of black shadows
// - 60-30-10 color rule

import 'package:flutter/material.dart';

/// STROP semantic color system matching original app + UI.md compliance
abstract class AppColors {
  // ===========================================
  // BRAND COLORS
  // ===========================================

  /// Primary brand color - dark blue
  static const Color primary = Color(0xFF1A237E);

  /// Primary light variant
  static const Color primaryLight = Color(0xFF534BAE);

  /// Primary dark variant
  static const Color primaryDark = Color(0xFF000051);

  /// Accent/Secondary color - orange for CTAs
  static const Color accent = Color(0xFFF57C00);

  /// Accent light
  static const Color accentLight = Color(0xFFFFAD42);

  // ===========================================
  // BACKGROUND COLORS (No pure black - UI.md Rule)
  // ===========================================

  /// Light background
  static const Color backgroundLight = Color(0xFFF5F5F5);

  /// Surface/Card color
  static const Color surface = Color(0xFFFFFFFF);

  /// Dark background - NOT pure black per UI.md
  static const Color backgroundDark = Color(0xFF121212);

  /// Dark surface
  static const Color surfaceDark = Color(0xFF1E1E1E);

  // ===========================================
  // INCIDENT TYPE COLORS
  // ===========================================

  /// Order/Instruction - Blue
  static const Color orderInstructionColor = Color(0xFF2196F3);

  /// Request/Query - Purple
  static const Color requestQueryColor = Color(0xFF9C27B0);

  /// Certification - Green
  static const Color certificationColor = Color(0xFF4CAF50);

  /// Incident Notification - Orange/Amber
  static const Color incidentNotificationColor = Color(0xFFFF9800);

  // ===========================================
  // STATUS COLORS
  // ===========================================

  /// Open status - Blue
  static const Color statusOpen = Color(0xFF2196F3);

  /// Assigned status - Amber
  static const Color statusAssigned = Color(0xFFFFC107);

  /// Closed status - Green
  static const Color statusClosed = Color(0xFF4CAF50);

  // ===========================================
  // PRIORITY COLORS
  // ===========================================

  /// Normal priority
  static const Color priorityNormal = Color(0xFF757575);

  /// Critical priority - Red
  static const Color priorityCritical = Color(0xFFF44336);

  // ===========================================
  // SEMANTIC COLORS
  // ===========================================

  /// Success green
  static const Color success = Color(0xFF4CAF50);

  /// Warning amber
  static const Color warning = Color(0xFFFFC107);

  /// Error red
  static const Color error = Color(0xFFF44336);

  /// Info blue
  static const Color info = Color(0xFF2196F3);

  // ===========================================
  // TEXT COLORS
  // ===========================================

  /// Primary text - NOT pure black
  static const Color textPrimary = Color(0xFF212121);

  /// Secondary text
  static const Color textSecondary = Color(0xFF757575);

  /// Hint/Disabled text
  static const Color textHint = Color(0xFF9E9E9E);

  /// Text on dark surfaces
  static const Color textOnDark = Color(0xFFFFFFFF);

  /// Text on primary
  static const Color textOnPrimary = Color(0xFFFFFFFF);

  // ===========================================
  // BORDER & DIVIDER
  // ===========================================

  /// Border color
  static const Color border = Color(0xFFE0E0E0);

  /// Divider color
  static const Color divider = Color(0xFFEEEEEE);

  // ===========================================
  // USER ROLE COLORS
  // ===========================================

  /// Owner role
  static const Color roleOwner = Color(0xFF1A237E);

  /// Superintendent role
  static const Color roleSuperintendent = Color(0xFF7B1FA2);

  /// Resident role
  static const Color roleResident = Color(0xFF1976D2);

  /// Cabo role
  static const Color roleCabo = Color(0xFF388E3C);

  // ===========================================
  // HELPER METHODS
  // ===========================================

  /// Get color for incident type
  static Color getIncidentTypeColor(String type) {
    switch (type.toUpperCase()) {
      case 'ORDER_INSTRUCTION':
        return orderInstructionColor;
      case 'REQUEST_QUERY':
        return requestQueryColor;
      case 'CERTIFICATION':
        return certificationColor;
      case 'INCIDENT_NOTIFICATION':
        return incidentNotificationColor;
      default:
        return textSecondary;
    }
  }

  /// Get color for incident status
  static Color getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'OPEN':
        return statusOpen;
      case 'ASSIGNED':
        return statusAssigned;
      case 'CLOSED':
        return statusClosed;
      default:
        return textSecondary;
    }
  }

  /// Get color for user role
  static Color getRoleColor(String role) {
    switch (role.toUpperCase()) {
      case 'OWNER':
        return roleOwner;
      case 'SUPERINTENDENT':
        return roleSuperintendent;
      case 'RESIDENT':
        return roleResident;
      case 'CABO':
        return roleCabo;
      default:
        return textSecondary;
    }
  }

  /// Get color for priority
  static Color getPriorityColor(String priority) {
    switch (priority.toUpperCase()) {
      case 'CRITICAL':
        return priorityCritical;
      default:
        return priorityNormal;
    }
  }

  /// Create with opacity helper
  static Color withOpacity(Color color, double opacity) {
    return color.withValues(alpha: opacity);
  }
}
