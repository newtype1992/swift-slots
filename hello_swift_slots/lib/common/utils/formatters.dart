import 'package:intl/intl.dart';

final DateFormat slotDateFormat = DateFormat('EEE, MMM d • h:mm a');
final DateFormat slotTimeFormat = DateFormat('h:mm a');
final NumberFormat priceFormat = NumberFormat.simpleCurrency();
final NumberFormat distanceFormat = NumberFormat('0.0');

String formatSlotTimeRange(DateTime start, DateTime end) {
  final startText = slotDateFormat.format(start);
  final endText = slotTimeFormat.format(end);
  return '$startText - $endText';
}

String formatTimeOfDay(DateTime value) => slotTimeFormat.format(value);

String formatPrice(double price, {String? currencyCode}) {
  if (currencyCode == null || currencyCode.isEmpty) {
    return priceFormat.format(price);
  }
  final normalized = currencyCode.toUpperCase();
  final customFormat = NumberFormat.simpleCurrency(name: normalized);
  return customFormat.format(price);
}

String formatDistance(double distanceKm) =>
    '${distanceFormat.format(distanceKm)} km away';
