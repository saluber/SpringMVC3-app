/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.dhenton9000.spring.mvc.controllers.backbone;

import java.io.IOException;
import java.io.StringWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.List;


import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.ModelAndView;

import com.dhenton9000.restaurant.model.Restaurant;
import com.dhenton9000.restaurant.model.RestaurantDTO;
import com.dhenton9000.restaurant.service.RestaurantService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mangofactory.swagger.annotations.ApiIgnore;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * 
 * @author dhenton
 */
@Controller
@ApiIgnore
@RequestMapping(value = "/backbone/demos/*")
public class BasicBackboneController {

        @Autowired
	private RestaurantService restaurantService;

	@RequestMapping(value = "/{modelId}", method = RequestMethod.DELETE)
	public void deleteBasicModel(@PathVariable String modelId) {

	}

	@RequestMapping("/localstorage")
	public ModelAndView gotoJasonDemo() {

		return new ModelAndView("tiles.backbone.demos.localstorage");
	}

	@RequestMapping("/js/model")
	public ModelAndView gotoJSModelDemo() {

		return new ModelAndView("tiles.backbone.demos.js.model");
	}
	
	@RequestMapping("/restservice/docs")
	public ModelAndView gotoRestServiceDocs() {

		return new ModelAndView("tiles.backbone.restservice");
	}
	
	

	@RequestMapping("/restaurant")
	public ModelAndView gotoBackBoneRestaurant() {

		List<RestaurantDTO> restaurants = new ArrayList<RestaurantDTO>();

		List<Restaurant> rItems = this.getRestaurantService()
				.getAllRestaurants();
		for (Restaurant r : rItems) {
			restaurants.add(new RestaurantDTO(r));
		}

		ObjectMapper mapper = new ObjectMapper();
		Writer w = new StringWriter();

		try {
			mapper.writeValue(w, restaurants);
		} catch (Exception e) {
			throw new RuntimeException("problem with json\n"+e.getClass().getName()+"\n"+e.getMessage());
		}

		String jsonData = w.toString();
		return new ModelAndView("tiles.backbone.restaurant", "jsonRestaurants",
				jsonData);
	}

	public RestaurantService getRestaurantService() {
		return restaurantService;
	}

	public void setRestaurantService(RestaurantService restaurantService) {
		this.restaurantService = restaurantService;
	}

}
