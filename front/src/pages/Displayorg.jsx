import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";

const Displayorg = () => {
  const [organizations, setOrganizations] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get(`http://localhost:5000/api/get-organizations`);
      setOrganizations(res.data);
    };
    fetchData();
  }, []);

  const filtered = organizations
    .filter((org) =>
      org.courses.some((course) =>
        course.title.toLowerCase().includes(search.toLowerCase())
      )
    )
    .sort((a, b) => b.views - a.views); // most viewed first

  return (
    <Container>
      <h2 className="mt-4 mb-3">Explore Our Partner Organizations</h2>

      <Form.Control
        type="text"
        placeholder="Search courses..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />

      <Row>
        {filtered.map((org, index) => (
          <Col md={6} lg={4} key={index}>
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <Card.Title>{org.organizationName}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {org.website}
                </Card.Subtitle>
                <Card.Text>
                  <strong>About:</strong> {org.about} <br />
                  <strong>Achievements:</strong> {org.achievements} <br />
                  <strong>Why Them:</strong> {org.uniqueness}
                </Card.Text>

                <h6>Courses:</h6>
                <ul>
                  {org.courses.map((course, idx) => (
                    <li key={idx}>
                      <strong>{course.title}</strong> - {course.duration} - ${course.price}
                    </li>
                  ))}
                </ul>
              </Card.Body>
              <Card.Footer>
                <small className="text-muted">👁 {org.views} views</small>
                <Button
                  as={Link}
             to={`/buycourse/${org.organizationId}`}  
                  variant="primary"
               className="float-end"
                >
            View Details
            </Button>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Displayorg;