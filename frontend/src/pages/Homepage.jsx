import Navbar from '../components/Navbar';
import HeroSection from '../components/homepage/HeroSection';
import StatsBar from '../components/homepage/StatsBar';
import QuickActions from '../components/homepage/QuickActions';
import HowItWorks from '../components/homepage/HowItWorks';
import ActivityFeed from '../components/homepage/ActivityFeed';
import UpcomingEvents from '../components/homepage/UpcomingEvents';
import Footer from '../components/homepage/Footer';
import './homepage.css';

export default function Homepage() {
	return (
		<div className="hp-page">
			<Navbar />
			<HeroSection />
			<StatsBar />
			<QuickActions />
			<HowItWorks />

			<section className="hp-section hp-section--soft hp-activity-wrap">
				<div className="hp-container hp-two-col">
					<ActivityFeed />
					<UpcomingEvents />
				</div>
			</section>

			<Footer />
		</div>
	);
}
