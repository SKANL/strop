import 'package:flutter/foundation.dart';
import 'package:logger/logger.dart';

/// Global logger instance configured according to DEVELOPMENT_RULES.md
final logger = Logger(
  printer: PrettyPrinter(
    
  ),
  level: kDebugMode ? Level.debug : Level.error,
);
