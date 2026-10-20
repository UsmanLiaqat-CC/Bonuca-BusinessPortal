import type { ManualCampaignType } from '@/types/domain'

export const CAMPAIGN_TYPE_LABELS: Record<ManualCampaignType, string> = {
  happy_hour: 'Happy Hour',
  new_item: 'New Item',
  double_stamps: 'Double Stamps',
  birthday_reward: 'Birthday Reward',
  holiday_campaign: 'Holiday Campaign',
  limited_offer: 'Limited Offers',
  other: 'Other wallet push notification',
}
