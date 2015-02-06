package com.dhenton9000.restaurant.service.impl;

import com.dhenton9000.jpa.dao.support.GenericDao;
import com.dhenton9000.jpa.service.support.GenericEntityServiceImpl;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import org.apache.log4j.LogManager;
import org.apache.log4j.Logger;

import javax.validation.ConstraintViolation;
import javax.validation.Validation;
import javax.validation.Validator;
import javax.validation.ValidatorFactory;

import com.dhenton9000.restaurant.dao.RestaurantDao;
import com.dhenton9000.restaurant.model.Restaurant;
import com.dhenton9000.restaurant.model.Review;
import com.dhenton9000.restaurant.service.RestaurantService;
import java.util.ArrayList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RestaurantServiceImpl extends GenericEntityServiceImpl<Restaurant, Long> implements RestaurantService {

    @Autowired
    private RestaurantDao restaurantDao;
    private static Logger log = LogManager
            .getLogger(RestaurantServiceImpl.class);

    @Override
    public List<Restaurant> getAllRestaurants() {

        return getRestaurantDao().getAllRestaurants();
    }

    @Override
    public Restaurant getRestaurant(Long id) {

        // return getRestaurantDao().getRestaurant(id);
        return this.getByPrimaryKey(id);
    }

    @Override
    @Transactional
    public Long saveOrAddRestaurant(Restaurant t) {

        log.debug("save or add restaurant " + t.getPrimaryKey());
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        Validator validator = factory.getValidator();
        Set<ConstraintViolation<Restaurant>> violations = validator.validate(t);
        if (violations.size() == 0) {
            if (t.getReviews() != null) {
                for (Review rv : t.getReviews()) {
                    //rv.setParentRestaurant(t);
                }
            }

            Restaurant aa = this.merge(t);
            return aa.getPrimaryKey();

        } else {
            HashMap<String, String> errors = new HashMap<String, String>();
            Iterator<ConstraintViolation<Restaurant>> iter = violations
                    .iterator();
            while (iter.hasNext()) {
                ConstraintViolation<Restaurant> violation = iter.next();
                errors.put(violation.getPropertyPath().toString(),
                        violation.getMessage());
                log.debug("saveOrAddRestaurant problem: " + violation.getPropertyPath().toString() + " " + violation.getMessage());
            }
            throw new ValidatorFailureException("errors found", errors);
        }

    }

    public RestaurantDao getRestaurantDao() {
        return restaurantDao;
    }

    public void setRestaurantDao(RestaurantDao restaurantDao) {
        this.restaurantDao = restaurantDao;
    }

    @Override
    @Transactional
    public void deleteRestaurant(Long key) {
        log.debug("hit deleteRestaurant " + key);
        this.deleteByPrimaryKey(key);
        // getRestaurantDao().deleteRestaurant(key);

    }

    @Override
    public List<Restaurant> getRestaurantsWithMaxRating(int ratingLimit) {

        return getRestaurantDao().getRestaurantsWithMaxRating(ratingLimit);
    }

    @Override
    public List<Restaurant> getRestaurantsLike(String searchString) {

        return getRestaurantDao().getRestaurantsLike(searchString);
    }

    @Override
    @Transactional
    public void deleteReview(Long restaurantId, Long reviewId) {
        Restaurant parent = getRestaurant(restaurantId);
        log.debug("hit deleteReview " + restaurantId + " " + reviewId);

        if (parent == null) {
            log.warn("could not find restaurant in delete review "
                    + restaurantId);
            return;
        }
        List<Review> reviews = parent.getReviews();
        log.debug("before delete " + reviews.size());
        //Key restaurantKey = new Key(restaurantId);
        //Key reviewKey = new Key(reviewId);
        int idx = -1;
        for (int i = 0; i < reviews.size(); i++) {
            log.debug("key review " + reviewId + " -- " + reviews.get(i).getId());
            if (reviews.get(i).getId().equals(reviewId)) {
                idx = i;
                break;
            }
        }
        log.debug("idx is " + idx);
        if (idx > -1) {
            log.debug("did remove ");
            parent.getReviews().remove(idx);
        }
        log.debug("after delete " + reviews.size());
        this.saveOrAddRestaurant(parent);

    }

    @Override
    @Transactional
    public Review saveReview(Long restaurantId, Review newReview) {
        Restaurant parent = getRestaurant(restaurantId);
        //log.debug("hit saveReview "+restaurantId+" "+newReview.getId().getId());

        if (parent == null) {
            log.warn("could not find restaurant in saveReview " + restaurantId);
            return null;
        }
        log.debug("saveReview found parent " + parent.getPrimaryKey());

        List<Review> reviews = parent.getReviews();
        Long reviewKey = newReview.getId();
        boolean isAdding = false;
        Long reviewKeyLong = null;
        if (reviewKey == null) {
            log.warn("review key null in  saveReview " + restaurantId);
            return null;
        } else {
            reviewKeyLong = new Long(reviewKey);
        }
        log.debug("review Key to match: " + reviewKey);

        for (int i = 0; i < reviews.size(); i++) {
            log.debug("key review " + reviewKeyLong + " " + reviews.get(i));
            if (new Long(reviews.get(i).getId())
                    .compareTo(reviewKeyLong) == 0) {
                log.debug("found match ");
                Review oR = reviews.get(i);
                oR.setReviewListing(newReview.getReviewListing());
                oR.setStarRating(newReview.getStarRating());
            }
        }
        this.saveOrAddRestaurant(parent);
        return newReview;
    }

    @Override
    @Transactional
    public Review addReview(Long restaurantId, Review newReview) {
        log.debug("hit addReview " + restaurantId);
        Restaurant parent = getRestaurant(restaurantId);
        if (parent == null) {
            log.warn("could not find restaurant in addReview " + restaurantId);
            return null;
        }

        
        ArrayList<Long> oldReviewKeys = new ArrayList<Long>();
        for (Review r : parent.getReviews()) {
            oldReviewKeys.add(r.getPrimaryKey());
        }

        parent.getReviews().add(newReview);
        this.saveOrAddRestaurant(parent);

        ArrayList<Long> newReviewKeys = new ArrayList<Long>();
        for (Review r : parent.getReviews()) {
            newReviewKeys.add(r.getPrimaryKey());
        }
        
        newReviewKeys.removeAll(oldReviewKeys);
        newReview.setId(newReviewKeys.get(0));

       
        return newReview;

    }

    @Override
    public GenericDao<Restaurant, Long> getDao() {
        return restaurantDao;
    }

    @Override
    public Restaurant getNew() {
        return new Restaurant();
    }

    @Override
    public Restaurant getNewWithDefaults() {
        return new Restaurant();
    }

}
