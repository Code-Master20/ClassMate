import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import noProfile from "../../../assets/noProfile.png";
import {
  deleteNotification,
  fetchNotifications,
  markNotificationsRead,
} from "../../../store/notifications/notificationsThunks";
import styles from "./NotificationCenter.module.css";

const SWIPE_DELETE_THRESHOLD = 96;
const SWIPE_MAX_OFFSET = 132;
const NOTIFICATIONS_CACHE_TTL_MS = 60 * 1000; // converting 60 s into milli sec that is 6000 milli seconds
const notificationsPageCache = new Map();
const NOTIFICATIONS_PAGE_SIZE = 30;

//ownerId is user id that is passed to this below function at the time of its calling
const getCachedNotificationsEntry = (ownerId) =>
  ownerId ? notificationsPageCache.get(`${ownerId}`) || null : null;

//Here cecking if the cached items with date is stale or not, if it is stale then we will fetch new items from backend
// This returns boolean : True or False
const isNotificationsCacheStale = (entry) =>
  // here entry is cached items with date or notificationsPageCached
  !entry || Date.now() - entry.updatedAt > NOTIFICATIONS_CACHE_TTL_MS;



  // notification.actor.profession is being passed to this function during its calling
  // this function is used to capitalize the first letter of each word in the profession string. 
  // For example, if the profession is "software engineer", 
  // it will be displayed as "Software Engineer".
  // "software  engineer".split(" ") ==> ["software", "", "engineer"].filter(Boolean) ==> 
  // ["software", "engineer"].map((word)=> word.caharAt(0).toUpperCase() + word.slice(1)) ==> ["Software","Enginer"]
  // and word.slice(1) is equal to oftware or ngineer
  // join(" ") is combining all elements of the array into a single string with a space between each element.
  // ["Software", "Engineer"].join(" ") ==> "Software Engineer"
const formatDisplayValue = (value) => {
  if (!value) return "";

  return `${value}`
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// This function is used to get the target link of the notification, if it is not present then it will return empty string
const getNotificationTarget = (notification) =>
  notification.link ||
  (notification.actor?._id ? `/profile/${notification.actor._id}` : "");

// friendOne and friendTwo
// if friendOne added a story, notification will send to friendTwo (View Story)
// If FriendTwo comment on the FriendOne's story , notification will send to FriendOne (Open Messages)
// If FriendTwo like the FriendOne's post, notification will send to FriendOne (Open Post)
// But if FriendTwo likes story of FriendOne, notification is not sending to friendOne, this to be implement later
const getNotificationActionLabel = (notification) =>
  notification.type === "story_added" && notification.link
    ? "View Story"
    : notification.type === "story_comment" && notification.link
      ? "Open Messages"
      : notification.type === "post_like" && notification.link
        ? "Open Post" //if someone like a post , message should be sent to the author with a preview of the post he liked
        // I will implement it later
        : "View Profile";

export const NotificationCenter = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    items,
    loading,
    loadingMore,
    deletingId,
    errorMessage,
    page,
    hasMore,
  } = useSelector((state) => state.notifications);
  const cacheKey = user?._id || ""; //inside cacheKey user id is presend
  // if items is inside notificationsPageCache with date, here they will store inside cachedEntry
  const cachedEntry = getCachedNotificationsEntry(cacheKey);
  const [searchText, setSearchText] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [cachedItemsSnapshot, setCachedItemsSnapshot] = useState(
    () => cachedEntry?.items || [],
  );
  const [activeSwipe, setActiveSwipe] = useState({
    notificationId: "",
    offsetX: 0,
  });  // here effectiveItems is being destructured and filtered based on the 
  // search text and sorted based on the sort order. The filtering is done by 
  // checking if the searchable text (which includes the notification message, 
  // actor's username, profession, and email) includes the normalized search text. 
  // The sorting is done based on the createdAt date of the notifications, either in 
  // ascending or descending order depending on 
  // the sort order selected by the user.
  const swipeGestureRef = useRef({
    notificationId: "",
    startX: 0,
    startY: 0,
    offsetX: 0,
    suppressClickFor: "",
  });
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const hydrateNotifications = async () => {
      const activeCacheEntry = getCachedNotificationsEntry(cacheKey);
      const shouldFetch =
        !items.length &&
        (!activeCacheEntry || isNotificationsCacheStale(activeCacheEntry));

      if (shouldFetch) {
        await dispatch(
          fetchNotifications({
            page: 1,
            limit: NOTIFICATIONS_PAGE_SIZE,
          }),
        );
      } else if (
        activeCacheEntry &&
        isNotificationsCacheStale(activeCacheEntry)
      ) {
        await dispatch(
          fetchNotifications({
            page: 1,
            limit: NOTIFICATIONS_PAGE_SIZE,
          }),
        );
      }

      await dispatch(markNotificationsRead());
    };

    if (cacheKey) {
      hydrateNotifications();
    }
  }, [cacheKey, dispatch]);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !hasMore || loading || loadingMore) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (!firstEntry.isIntersecting) {
          return;
        }

        dispatch(
          fetchNotifications({
            page: page + 1,
            limit: NOTIFICATIONS_PAGE_SIZE,
          }),
        );
      },
      {
        root: null,
        rootMargin: "300px",
        threshold: 0,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [dispatch, page, hasMore, loading, loadingMore]);

  // This useEffect will be effective if user id is present, cause this will not return in that case
  useEffect(() => {
    if (!cacheKey) {
      setCachedItemsSnapshot([]);
      return;
    }

    const activeCacheEntry = getCachedNotificationsEntry(cacheKey);
    setCachedItemsSnapshot(activeCacheEntry?.items || []);
  }, [cacheKey]);

  //cacheKey is authenticated user id
  // this useEffect will be effective if user id is present and loading is false, in that case return will  not be initiated
  useEffect(() => {
    if (!cacheKey || loading) {
      return;
    }

    // Here items with a date as a whole is setting to notificationsPageCache
    notificationsPageCache.set(`${cacheKey}`, {
      items,
      updatedAt: Date.now(),
    });
    setCachedItemsSnapshot(items);
  }, [cacheKey, items, loading]);

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }, [errorMessage]);

  // here effectiveItems is being set to items if items is not empty, otherwise it will be set to cachedItemsSnapshot.
  const effectiveItems = items.length ? items : cachedItemsSnapshot; //here if no notifications to be fatched from backend as no new notifications are
  // present in mongodb, then cachedItemsSnapshot will be used to show the notifications that are already present in the cache
  const notificationsInitialLoading = loading && !effectiveItems.length;
  const normalizedSearchText = searchText.trim().toLowerCase();
  // here effectiveItems is being destructured and filtered based on the 
  // search text and sorted based on the sort order. The filtering is done by 
  // checking if the searchable text (which includes the notification message, 
  // actor's username, profession, and email) includes the normalized search text. 
  // The sorting is done based on the createdAt date of the notifications, either in 
  // ascending or descending order depending on 
  // the sort order selected by the user.
  const visibleItems = [...effectiveItems] //TOMORROW STARTS HERE
    .filter((notification) => {
      if (!normalizedSearchText) {
        return true;
      }

      const searchableText = [
        notification.message,
        notification.actor?.username,
        notification.actor?.profession,
        notification.actor?.email,
      ]
        .filter(Boolean)   //It is essentially doing---> .filter((value) => {return Boolean(value)})
        // and removing any null/undefined value from searchableText array
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearchText);
    })
    .sort((firstItem, secondItem) => {
      const firstDate = new Date(firstItem.createdAt).getTime();
      const secondDate = new Date(secondItem.createdAt).getTime();

      // What does sort() understand?
      // A negative result means:
      // Put firstItem before secondItem.

      // What does sort() understand?
      // A positive result means:
      // Put firstItem AFTER secondItem.
      return sortOrder === "oldest"
        ? firstDate - secondDate
        : secondDate - firstDate;
    });

  const handleDeleteNotification = async (notificationId) => {
    setActiveSwipe((current) =>
      current.notificationId === notificationId
        ? { notificationId: "", offsetX: 0 }
        : current,
    );

    const resultAction = await dispatch(deleteNotification(notificationId));

    if (deleteNotification.fulfilled.match(resultAction)) {
      toast.success(resultAction.payload?.message || "Notification removed");
    }
  };

  const handleSwipeStart = (notificationId, touch) => {
    swipeGestureRef.current = {
      notificationId,
      startX: touch.clientX,
      startY: touch.clientY,
      offsetX: 0,
      suppressClickFor: swipeGestureRef.current.suppressClickFor,
    };

    setActiveSwipe((current) =>
      current.notificationId === notificationId
        ? current
        : { notificationId, offsetX: 0 },
    );
  };

  const handleSwipeMove = (notificationId, touch) => {
    if (swipeGestureRef.current.notificationId !== notificationId) {
      return;
    }

    const deltaX = touch.clientX - swipeGestureRef.current.startX;
    const deltaY = touch.clientY - swipeGestureRef.current.startY;

    if (Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    const nextOffsetX = Math.max(-SWIPE_MAX_OFFSET, Math.min(0, deltaX));
    swipeGestureRef.current.offsetX = nextOffsetX;

    if (Math.abs(nextOffsetX) > 10) {
      swipeGestureRef.current.suppressClickFor = notificationId;
    }

    setActiveSwipe({ notificationId, offsetX: nextOffsetX });
  };

  const handleSwipeEnd = (notificationId) => {
    if (swipeGestureRef.current.notificationId !== notificationId) {
      return;
    }

    const offsetX = swipeGestureRef.current.offsetX;
    swipeGestureRef.current.notificationId = "";
    swipeGestureRef.current.offsetX = 0;

    if (offsetX <= -SWIPE_DELETE_THRESHOLD) {
      handleDeleteNotification(notificationId);
      return;
    }

    setActiveSwipe((current) =>
      current.notificationId === notificationId
        ? { notificationId: "", offsetX: 0 }
        : current,
    );
  };

  const handleNotificationNavigation = (notification, event) => {
    if (swipeGestureRef.current.suppressClickFor === notification._id) {
      swipeGestureRef.current.suppressClickFor = "";
      event.preventDefault();
      event.stopPropagation();
      return;
    }
// Here getNotificationTarget is being called that is defined above 
// this functions is used to get link of the profile
    const target = getNotificationTarget(notification);

    if (target) {
      navigate(target);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.content}>
        <header className={styles.pageHeader}>
          <p>Network</p>
          <h1>Notifications</h1>
        </header>

        {notificationsInitialLoading ? (
          <>
            <section
              className={styles.toolbarSkeleton}
              aria-label="Loading notification controls"
            >
              <div className={styles.fieldSkeletonStack}>
                <span
                  className={`${styles.fieldLabelSkeleton} ${styles.skeletonBlock}`}
                />
                <div
                  className={`${styles.fieldSkeleton} ${styles.skeletonBlock}`}
                />
              </div>

              <div className={styles.fieldSkeletonStack}>
                <span
                  className={`${styles.fieldLabelSkeleton} ${styles.skeletonBlock}`}
                />
                <div
                  className={`${styles.fieldSkeletonShort} ${styles.skeletonBlock}`}
                />
              </div>
            </section>

            <section
              className={styles.notificationList}
              aria-label="Loading notifications"
            >
              {Array.from({ length: 4 }, (_, index) => (
                <article
                  key={`notification-skeleton-${index}`}
                  className={`${styles.notificationRow} ${styles.notificationRowSkeleton}`}
                  aria-hidden="true"
                >
                  <div className={styles.notificationCard}>
                    <div className={styles.notificationMain}>
                      <div
                        className={`${styles.avatarSkeleton} ${styles.skeletonBlock}`}
                      />
                      <div className={styles.notificationBodySkeleton}>
                        <div className={styles.notificationTopSkeleton}>
                          <div
                            className={`${styles.notificationLinePrimary} ${styles.skeletonBlock}`}
                          />
                          <div
                            className={`${styles.notificationTimeSkeleton} ${styles.skeletonBlock}`}
                          />
                        </div>
                        <div
                          className={`${styles.notificationLineSecondary} ${styles.skeletonBlock}`}
                        />
                        <div
                          className={`${styles.notificationLineTertiary} ${styles.skeletonBlock}`}
                        />
                      </div>
                    </div>

                    <div className={styles.notificationActions}>
                      <div
                        className={`${styles.actionSkeleton} ${styles.skeletonBlock}`}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </>
        ) : (
          // here searchText is a useState variable that is being set to the value of the input field when the user types in it.
          <section className={styles.toolbar}>
            <label className={styles.searchField}>
              <span>Search</span>
              <input
                type="search"
                value={searchText} 
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search by name or notification text"
              />
            </label>

            <label className={styles.sortField}>
              <span>Order</span>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              >
                <option value="newest">New to old</option>
                <option value="oldest">Old to new</option>
              </select>
            </label>
          </section>
        )}

        {!notificationsInitialLoading && effectiveItems.length === 0 ? (
          <section className={styles.placeholder}>
            You do not have any notifications yet.
          </section>
        ) : visibleItems.length === 0 ? (
          <section className={styles.placeholder}>
            No notifications match that search.
          </section>
        ) : (
          <section className={styles.notificationList}>
            {visibleItems.map((notification) => (
              <article
                key={notification._id}
                className={`${styles.notificationRow} ${
                  notification.read ? styles.readCard : styles.unreadCard
                }`}
                onTouchStart={(event) =>
                  handleSwipeStart(notification._id, event.changedTouches[0])
                }
                onTouchMove={(event) =>
                  handleSwipeMove(notification._id, event.changedTouches[0])
                }
                onTouchEnd={() => handleSwipeEnd(notification._id)}
                onTouchCancel={() => handleSwipeEnd(notification._id)}
              >
                <button
                  type="button"
                  className={styles.swipeDeleteAction}
                  onClick={() => handleDeleteNotification(notification._id)}
                  disabled={deletingId === notification._id}
                  aria-label={`Delete notification from ${
                    notification.actor?.username || "user"
                  }`}
                >
                  {deletingId === notification._id ? "Removing..." : "Delete"}
                </button>

                <div
                  className={styles.notificationCard}
                  style={{
                    transform:
                      activeSwipe.notificationId === notification._id
                        ? `translateX(${activeSwipe.offsetX}px)`
                        : "translateX(0px)",
                  }}
                >
                {/* This shows profile pic of the user who caused notification */}
                  <button
                    type="button"
                    className={styles.notificationMain}
                    onClick={(event) =>
                      handleNotificationNavigation(notification, event)
                    }
                    disabled={!getNotificationTarget(notification)}
                  >
                    <img
                      src={notification.actor?.avatar || noProfile}
                      alt={notification.actor?.username || "user"}
                      className={styles.avatar}
                    />

                    <div className={styles.notificationBody}>
                      <div className={styles.notificationTop}>
                        <h2>{notification.message}</h2>

                        <span>
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {notification.actor?.profession ? (
                        <p className={styles.actorMeta}>
                          {/*here formatDisplayValue function is used to capitalize the first 
                          letter of each word in the profession string. 
                          For example, if the profession is "software engineer", 
                          it will be displayed as "Software Engineer".*/}
                          {formatDisplayValue(notification.actor.profession)}
                        </p>
                      ) : null}

                      {notification.actor?.email ? (
                        <p className={styles.actorMeta}>
                          {notification.actor.email}
                        </p>
                      ) : null}
                    </div>
                  </button>

                  <div className={styles.notificationActions}>
                    <button
                      type="button"
                      className={styles.viewBtn}
                      onClick={(event) =>
                        handleNotificationNavigation(notification, event)
                      }
                      disabled={!getNotificationTarget(notification)}
                    >
                      {getNotificationActionLabel(notification)}
                    </button>
                  </div>
                </div>

                <span className={styles.swipeHint}>Swipe left to delete</span>
              </article>
            ))}

            {/* Infinite-scroll trigger */}
            {hasMore ? (
              <div
                ref={loadMoreRef}
                aria-hidden="true"
                style={{
                  minHeight: "1px",
                }}
              />
            ) : null}

            {loadingMore ? (
              <div
                style={{
                  padding: "16px",
                  textAlign: "center",
                }}
              >
                Loading more notifications...
              </div>
            ) : null}
          </section>
        )}
      </section>
    </main>
  );
};
