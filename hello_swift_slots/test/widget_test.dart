// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:hello_swift_slots/app/app.dart';

void main() {
  testWidgets('App boots and renders Swift Slots title', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: App()));
    expect(find.text('Swift Slots'), findsWidgets);
  });
}
