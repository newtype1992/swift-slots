import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../app/providers.dart';
import '../../common/utils/formatters.dart';
import '../../common/widgets/app_scaffold.dart';
import '../auth/auth_providers.dart';
import '../auth/sign_in_screen.dart';
import '../feed/feed_screen.dart';
import '../feed/slot_model.dart';

class CheckoutScreen extends HookConsumerWidget {
  const CheckoutScreen({super.key, this.slot});

  static const routeName = 'checkout';

  final Slot? slot;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentSlot = slot;
    final useMock = ref.watch(useMockSlotsProvider);
    final user = ref.watch(currentUserProvider);
    final isLoading = useState(false);

    if (currentSlot == null) {
      return const AppScaffold(
        title: 'Swift Slots',
        body: Center(child: Text('No slot selected for checkout.')),
      );
    }

    Future<void> handleConfirm() async {
      final messenger = ScaffoldMessenger.of(context);
      if (user == null) {
        messenger.showSnackBar(
          const SnackBar(content: Text('Please sign in to confirm bookings.')),
        );
        context.goNamed(SignInScreen.routeName);
        return;
      }

      if (useMock) {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Switch to Firestore mode to confirm real bookings.'),
          ),
        );
        return;
      }

      isLoading.value = true;
      try {
        await ref
            .read(bookingRepositoryProvider)
            .confirmBooking(slot: currentSlot, user: user);
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Booking requested! We will update you soon.'),
          ),
        );
        if (context.mounted) {
          context.goNamed(FeedScreen.routeName);
        }
      } catch (error) {
        messenger.showSnackBar(
          SnackBar(content: Text('Failed to confirm booking: $error')),
        );
      } finally {
        isLoading.value = false;
      }
    }

    return AppScaffold(
      title: 'Checkout',
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              currentSlot.businessName,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 12),
            Text(
              formatSlotTimeRange(currentSlot.startTime, currentSlot.endTime),
            ),
            const SizedBox(height: 12),
            Text('Total: ${formatPrice(currentSlot.price)}'),
            if (currentSlot.discountPct > 0) ...[
              const SizedBox(height: 8),
              Text('Discount applied: ${currentSlot.discountPct}%'),
            ],
            const SizedBox(height: 24),
            Text(
              'Confirm to reserve this slot. We will create a booking record and notify the business.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const Spacer(),
            FilledButton.icon(
              onPressed: isLoading.value ? null : handleConfirm,
              icon: const Icon(Icons.check_circle_outline),
              label: isLoading.value
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Confirm Booking'),
            ),
          ],
        ),
      ),
    );
  }
}
