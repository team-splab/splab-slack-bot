import axios from 'axios';
import { Menu } from './menu';

export class GreeatMenuRepository {
  private API_MEALS_URL = 'https://api-greeat.52g.gs/meals';
  private API_STATUS_URL = 'https://api-greeat.52g.gs/status/date';

  public async fetchMenus(): Promise<Menu[]> {
    const todayString = this.getTodayString();
    const [mealsResponse, statusResponse] = await Promise.all([
      axios.get(`${this.API_MEALS_URL}/${todayString}`),
      axios.get(`${this.API_STATUS_URL}/${todayString}`),
    ]);
    const mealsData = mealsResponse.data.data.meal;
    const statusData = statusResponse.data.data.daily_meal_status;

    return [
      {
        cornerName: ':large_yellow_circle: G',
        name: mealsData.main_of_g,
        maxQuantity: statusData.number_of_meals_by_manager.g,
        currentQuantity: statusData.number_of_meals.g,
        kcal: mealsData.calorie_g,
        imageUrl: mealsData.image_url_g,
        category: mealsData.group_of_g,
      },
      {
        cornerName: ':large_orange_circle: R',
        name: mealsData.main_of_r,
        maxQuantity: statusData.number_of_meals_by_manager.r,
        currentQuantity: statusData.number_of_meals.r,
        kcal: mealsData.calorie_r,
        imageUrl: mealsData.image_url_r,
        category: mealsData.group_of_r,
      },
      {
        cornerName: ':large_green_circle: E',
        name: mealsData.main_of_e,
        maxQuantity: statusData.number_of_meals_by_manager.e,
        currentQuantity: statusData.number_of_meals.e,
        kcal: mealsData.calorie_e,
        imageUrl: mealsData.image_url_e,
        category: mealsData.group_of_e,
      },
    ];
  }

  private getTodayString(): string {
    const today = new Date();
    const monthString = (today.getMonth() + 1).toString().padStart(2, '0');
    const dateString = today.getDate().toString().padStart(2, '0');
    return `${today.getFullYear()}${monthString}${dateString}`;
  }
}
