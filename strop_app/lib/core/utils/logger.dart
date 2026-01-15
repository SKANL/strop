import 'package:logger/logger.dart';
import 'package:flutter/foundation.dart';

/// Global logger instance configured according to DEVELOPMENT_RULES.md
final logger = Logger(
  printer: PrettyPrinter(
    methodCount: 2, // Number of method calls to display
    errorMethodCount: 8, // Number of method calls if stacktrace is provided
    lineLength: 120, // Width of the output
    colors: true, // Colorful log messages
    printEmojis: true, // Print an emoji for each log message
    dateTimeFormat: DateTimeFormat.none,
  ),
  level: kDebugMode ? Level.debug : Level.error,
);
