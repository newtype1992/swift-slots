import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../app/providers.dart';
import '../../common/widgets/app_scaffold.dart';
import '../../common/utils/formatters.dart';
import '../auth/profile_screen.dart';
import '../slot_detail/slot_detail_screen.dart';
import 'slot_model.dart';

class FeedScreen extends HookConsumerWidget {
  const FeedScreen({super.key});

  static const routeName = 'feed';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final useMock = ref.watch(useMockSlotsProvider);
    final slotsAsync = ref.watch(slotsStreamProvider);

    return AppScaffold(
      title: 'Swift Slots',
      actions: [
        IconButton(
          tooltip: 'Profile',
          icon: const Icon(Icons.person_outline),
          onPressed: () => context.pushNamed(ProfileScreen.routeName),
        ),
      ],
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    useMock
                        ? 'Using mock data. Flip the switch to view Firestore slots.'
                        : 'Streaming real slots from Firestore.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
                Switch(
                  value: !useMock,
                  onChanged: (value) {
                    ref.read(useMockSlotsProvider.notifier).state = !value;
                  },
                ),
              ],
            ),
          ),
          Expanded(
            child: slotsAsync.when(
              data: (slots) {
                if (slots.isEmpty) {
                  return const Center(
                    child: Text('No open slots right now. Check back soon!'),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  itemCount: slots.length,
                  itemBuilder: (context, index) {
                    final slot = slots[index];
                    return _SlotCard(
                      slot: slot,
                      onTap: () => context.pushNamed(
                        SlotDetailScreen.routeName,
                        pathParameters: {'id': slot.id},
                        extra: slot,
                      ),
                    );
                  },
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                );
              },
              error: (error, stackTrace) => Center(
                child: Text('Something went wrong: ${error.toString()}'),
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
          ),
        ],
      ),
    );
  }
}

class _SlotCard extends StatelessWidget {
  const _SlotCard({required this.slot, required this.onTap});

  final Slot slot;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(slot.businessName, style: theme.textTheme.titleMedium),
                  Text(
                    formatPrice(slot.price),
                    style: theme.textTheme.titleMedium,
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(slot.category, style: theme.textTheme.labelMedium),
              const SizedBox(height: 8),
              Text(formatSlotTimeRange(slot.startTime, slot.endTime)),
              const SizedBox(height: 8),
              Text(slot.address),
              const SizedBox(height: 4),
              Text(
                formatDistance(slot.distanceKm),
                style: theme.textTheme.bodySmall,
              ),
              if (slot.discountPct > 0) ...[
                const SizedBox(height: 8),
                Text(
                  'Save ${slot.discountPct}% when you book now',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
