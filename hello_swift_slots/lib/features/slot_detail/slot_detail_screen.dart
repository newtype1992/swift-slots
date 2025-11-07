import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../app/providers.dart';
import '../../common/utils/formatters.dart';
import '../../common/widgets/app_scaffold.dart';
import '../booking/checkout_screen.dart';
import '../feed/slot_model.dart';

class SlotDetailScreen extends HookConsumerWidget {
  const SlotDetailScreen({super.key, required this.slotId, this.initialSlot});

  static const routeName = 'slot-detail';

  final String slotId;
  final Slot? initialSlot;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final slot = ref.watch(slotByIdProvider(slotId)) ?? initialSlot;

    if (slot == null) {
      return const AppScaffold(
        title: 'Swift Slots',
        body: Center(child: Text('Slot not found.')),
      );
    }

    final theme = Theme.of(context);
    final isAvailable = slot.status == 'open';

    return AppScaffold(
      title: slot.businessName,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(slot.category, style: theme.textTheme.labelLarge),
            const SizedBox(height: 12),
            Text(
              formatSlotTimeRange(slot.startTime, slot.endTime),
              style: theme.textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 18),
                const SizedBox(width: 6),
                Expanded(child: Text(slot.address)),
              ],
            ),
            const SizedBox(height: 8),
            Text(formatDistance(slot.distanceKm)),
            const SizedBox(height: 16),
            Text(
              'Price: ${formatPrice(slot.price)}',
              style: theme.textTheme.titleMedium,
            ),
            if (slot.discountPct > 0) ...[
              const SizedBox(height: 8),
              Text('Discount: ${slot.discountPct}%'),
            ],
            const SizedBox(height: 24),
            Text(
              'Swift Slots makes it easy to book last-minute openings from nearby businesses. Confirm your booking to secure this slot immediately.',
              style: theme.textTheme.bodyMedium,
            ),
          ],
        ),
      ),
      floatingActionButton: FilledButton.icon(
        onPressed: isAvailable
            ? () {
                context.pushNamed(CheckoutScreen.routeName, extra: slot);
              }
            : null,
        icon: const Icon(Icons.shopping_bag_outlined),
        label: Text(isAvailable ? 'Hold Slot' : 'Unavailable'),
      ),
    );
  }
}
