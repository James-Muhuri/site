import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const WelcomeLearners = () => {
  return (
    <Container className="mt-5">
      <Row className="justify-content-center mb-4">
        <Col md={10} lg={8}>
          <Card className="shadow p-4 border-0">
            <Card.Body>
              <h2 className="text-center mb-4">🎓 Welcome to Your Learning Journey</h2>
              <p className="lead text-center">
                Whether you're a full-time student or a busy professional, we have something just for you.
              </p>

              <hr />

              <h4 className="mt-4">🧭 Learn at Your Own Pace</h4>
              <p>
                Our <strong>Self-Paced Courses</strong> allow you to study on your schedule, anytime and anywhere. 
                You’ll receive access to high-quality recorded lectures, downloadable resources, assignments, and quizzes—all designed by seasoned instructors to help you succeed.
              </p>

              <h4 className="mt-4">📅 Join Live Semester Courses</h4>
              <p>
                Prefer structured learning? Our <strong>Live Semester Courses</strong> offer scheduled lessons with interactive sessions, live Q&A, and real-time feedback from professional educators. 
                Perfect for staying motivated and connected with other learners.
              </p>

              <h4 className="mt-4">🤝 Learn from Trusted Experts</h4>
              <p>
                We’ve partnered with experienced instructors and respected organizations to bring you practical, career-ready courses. 
                Our content is curated to match current industry needs, ensuring your skills stay sharp and relevant.
              </p>

              <div className="text-center mt-5">
                <Link to="/displayorg">
                  <Button variant="primary" size="lg">
                    🚀 Explore Courses
                  </Button>
                </Link>

              </div>
                   <div className="text-center mt-5">
                <Link to="/mypaidcoursesstudent">
                  <Button variant="primary" size="lg">
                    Courses you have paid for 
                  </Button>
                </Link>
                
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default WelcomeLearners;