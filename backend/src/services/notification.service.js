/**
 * Notification Service
 * Creates notifications for key platform events
 */

import prisma from '../utils/prisma.js';

export async function notify(
  userId,
  type,
  title,
  message,
  link = null
) {

  try {

    await prisma.notification.create({

      data: {

        user_id: userId,
        type,
        title,
        message,
        link

      },

    });

  } catch (err) {

    console.error(
      '[Notification] Failed to create:',
      err.message
    );

  }

}

export const NOTIF_TYPES = {

  INTEREST_RECEIVED:
    'INTEREST_RECEIVED',

  LISTING_APPROVED:
    'LISTING_APPROVED',

  STAGE_CHANGED:
    'STAGE_CHANGED',

  MESSAGE_RECEIVED:
    'MESSAGE_RECEIVED',

  SCORE_IMPROVED:
    'SCORE_IMPROVED',

};

export async function notifyInterestReceived(
  seekerId,
  investorName,
  listingName,
  listingId
) {

  await notify(

    seekerId,

    NOTIF_TYPES.INTEREST_RECEIVED,

    'New investor interest',

    `${investorName} expressed interest in ${listingName}`,

    `/seeker/inbox`

  );

}

export async function notifyListingApproved(
  seekerId,
  listingName,
  listingId
) {

  await notify(

    seekerId,

    NOTIF_TYPES.LISTING_APPROVED,

    'Listing approved',

    `Your listing "${listingName}" has been approved and is now live`,

    `/seeker/listings/${listingId}`

  );

}

/*
  DEAL STAGE CHANGED
*/

export async function notifyStageChanged(

  userId,
  role,
  stage,
  listingName,
  connectionId

) {

  
  await notify(

    userId,

    NOTIF_TYPES.STAGE_CHANGED,

    'Deal stage updated',

    `Deal for "${listingName}" moved to ${stage.replace(/_/g, ' ')}`,

   `/connections/${connectionId}`
  );

}

/*
  NEW MESSAGE
*/

export async function notifyMessageReceived(

  userId,
  senderName,
  listingName,
  connectionId

) {

  await notify(

    userId,

    NOTIF_TYPES.MESSAGE_RECEIVED,

    'New message',

    `${senderName} sent a message about ${listingName}`,

    `/connections/${connectionId}`

  );

}
/*
  SCORE IMPROVED
*/

export async function notifyScoreImproved(

  seekerId,
  listingName,
  listingId,
  oldGrade,
  newGrade

) {

  await notify(

    seekerId,

    NOTIF_TYPES.SCORE_IMPROVED,

    'Score improved',

    `"${listingName}" improved from Grade ${oldGrade} to Grade ${newGrade}`,

    `/seeker/listings/${listingId}/score`

  );

}